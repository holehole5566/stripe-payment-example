// src/Payment.js
import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe("pk_test_********************");

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [clientSecret, setClientSecret] = useState("");
  const [price, setPrice] = useState(100);
  const [statusMessage, setStatusMessage] = useState("");

  // 建立新的 PaymentIntent
  const createPaymentIntent = async () => {
    setStatusMessage("");
    const res = await fetch("http://localhost:8000/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: price }),
    });
    const data = await res.json();
    setClientSecret(data.clientSecret);
  };

  // 處理付款
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    const cardElement = elements.getElement(CardElement);
    setStatusMessage("處理付款中...");

    const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (error) {
      setStatusMessage("付款失敗: " + error.message);
    } else if (paymentIntent.status === "succeeded") {
      setStatusMessage("付款成功 ✅");

      // 付款成功後：清掉 client_secret，重置表單回到輸入金額
      setClientSecret("");
      setPrice(100);
      elements.getElement(CardElement).clear();
    }
  };

  return (
    <div className="p-4 border rounded w-96 mx-auto">
      <h2 className="text-xl mb-2">模擬商品結帳</h2>
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="border p-2 w-full mb-2"
        placeholder="輸入金額 (TWD)"
      />
      <button
        onClick={createPaymentIntent}
        className="px-4 py-2 bg-green-500 text-white rounded mb-4"
      >
        建立付款
      </button>

      {clientSecret && (
        <>
          <p className="mb-2 break-all">
            <strong>Client Secret(for debug only):</strong> {clientSecret}
          </p>
          <form onSubmit={handleSubmit}>
            <CardElement />
            <button
              type="submit"
              disabled={!stripe}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Pay {price} TWD
            </button>
          </form>
        </>
      )}

      {statusMessage && <p className="mt-2">{statusMessage}</p>}
    </div>
  );
}

export default function Payment() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}