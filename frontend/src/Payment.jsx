import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe("");

function CheckoutForm({ clientSecret, onPaymentSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [statusMessage, setStatusMessage] = useState("");
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setStatusMessage("處理付款中...");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (error) {
      setStatusMessage("付款失敗: " + error.message);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // 顯示成功畫面
      setShowSuccessScreen(true);
      setStatusMessage("");

      // 2秒後回到初始頁面
      setTimeout(() => {
        setShowSuccessScreen(false);
        onPaymentSuccess();
      }, 2000);
    }
  };

  if (showSuccessScreen) {
    return (
      <div className="p-4 border rounded text-center">
        <h2 className="text-2xl text-green-600">付款成功 ✅</h2>
        <p>正在回到商品頁面...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        付款
      </button>
      {statusMessage && <p>{statusMessage}</p>}
    </form>
  );
}

export default function PaymentPage() {
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(100);

  const handleCreatePaymentIntent = async () => {
    const res = await fetch("http://localhost:8000/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseInt(amount) }),
    });
    const data = await res.json();
    setClientSecret(data.clientSecret);
  };

  const handlePaymentSuccess = () => {
    setClientSecret("");
    setAmount(100);
  };

  return (
    <div className="p-4 border rounded w-96 mx-auto flex flex-col gap-4">
      <h2 className="text-xl">模擬商品結帳</h2>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border p-2"
        placeholder="輸入金額 (TWD)"
      />

      <button
        onClick={handleCreatePaymentIntent}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        建立付款
      </button>

      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm clientSecret={clientSecret} onPaymentSuccess={handlePaymentSuccess} />
        </Elements>
      )}
    </div>
  );
}
