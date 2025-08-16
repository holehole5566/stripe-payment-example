# backend/main.py
import stripe
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

class PaymentRequest(BaseModel):
    amount: int  # 前端傳來的金額 (TWD)

app = FastAPI()

# CORS for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Stripe API Key (測試用)
stripe.api_key = "sk_test_********************"

@app.post("/create-payment-intent")
async def create_payment_intent(req: PaymentRequest):
    try:
        intent = stripe.PaymentIntent.create(
            amount=req.amount * 100,  # Stripe 單位是分
            currency="twd",
            automatic_payment_methods={"enabled": True},
        )
        return {"clientSecret": intent["client_secret"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@app.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    endpoint_secret = "whsec_********************"  

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        print("✅ Payment succeeded:", payment_intent["id"])
        # 這裡把交易資訊存到 DB

    return {"status": "success"}
