# ⚡ 5-Minute Quick Start Guide

**Just want to get it running? Follow these 5 steps:**

## 🚀 Step 1: Generate Secret Key
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
**Copy the result!**

## 📝 Step 2: Create Config File
```bash
copy env.prod.template .env.prod
```

## ✏️ Step 3: Edit .env.prod
Change these 2 lines:
```bash
SECRET_KEY=PASTE_YOUR_SECRET_KEY_HERE
POSTGRES_PASSWORD=your-password-here
```

## 🐳 Step 4: Deploy
```bash
.\deploy-prod.ps1
```

## 🌐 Step 5: Test
Open http://localhost:3000 in your browser

---

**That's it!** 🎉

**Need the full guide?** Read `DEPLOYMENT_FOR_DUMMIES.md`
