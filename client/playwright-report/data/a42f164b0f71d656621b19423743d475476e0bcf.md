# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]: M
  - heading "Create account" [level=1] [ref=e6]
  - generic [ref=e7]:
    - textbox "Email" [ref=e12]
    - generic [ref=e16]:
      - textbox "Password" [ref=e18]
      - button "Toggle password" [ref=e20] [cursor=pointer]:
        - img [ref=e21] [cursor=pointer]: visibility_off
    - generic [ref=e27]:
      - textbox "Confirm password" [ref=e29]
      - button "Toggle password" [ref=e31] [cursor=pointer]:
        - img [ref=e32] [cursor=pointer]: visibility_off
    - button "Create account" [ref=e36]:
      - generic [ref=e38]: Create account
  - paragraph [ref=e42]:
    - text: Already have an account?
    - link "Sign in" [ref=e43]:
      - /url: /auth/login
```