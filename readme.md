
# stripe testing doc

https://docs.stripe.com/testing

using stripe cli for localhost webhook:
```
// login cli
stripe login

// start a listener to forward stripe cli event
stripe listen --forward-to localhost:8000/webhook

// trigger an event
stripe trigger payment_intent.succeeded
```


## payment system design
https://youtu.be/kuoyb474EIA?si=n7_7GxeaVgkrjtJY



## flow
```
[ React 前端 ]
   |
   | 1. 輸入金額 → POST /create-payment-intent
   |    ← 拿到 client_secret
   |
   | 2. 使用 stripe.confirmCardPayment(client_secret) 付款
   |       → Stripe 處理付款
   |
   | 3. 前端接收付款結果 (paymentIntent / error)
   |    - 成功：顯示付款成功訊息，清掉 client_secret
   |    - 失敗：顯示錯誤訊息，可重試
   |
[ Stripe ]
   |
   | 4a. 付款成功 → 發送 webhook event payment_intent.succeeded
   | 4b. 付款失敗 → 發送 webhook event payment_intent.payment_failed
   |
[ 後端 Webhook ]
   | 5. 驗證簽名 (by endpoint_secret)
   | 6. 更新訂單表狀態 (paid / failed)
   | 7. 插入付款明細 (payments table)
```