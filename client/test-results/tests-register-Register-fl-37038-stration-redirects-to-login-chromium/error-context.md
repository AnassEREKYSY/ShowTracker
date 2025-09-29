# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]: M
  - heading "Create account" [level=1] [ref=e7]
  - generic [ref=e8]:
    - textbox "Email" [ref=e13]
    - generic [ref=e17]:
      - textbox "Password" [ref=e19]
      - button "Toggle password" [ref=e21] [cursor=pointer]:
        - img [ref=e22] [cursor=pointer]: visibility_off
    - generic [ref=e28]:
      - textbox "Confirm password" [ref=e30]
      - button "Toggle password" [ref=e32] [cursor=pointer]:
        - img [ref=e33] [cursor=pointer]: visibility_off
    - button "Create account" [ref=e37] [cursor=pointer]:
      - generic [ref=e39] [cursor=pointer]: Create account
  - paragraph [ref=e43]:
    - text: Already have an account?
    - link "Sign in" [ref=e44] [cursor=pointer]:
      - /url: /auth/login
```