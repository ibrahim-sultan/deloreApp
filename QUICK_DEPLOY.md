# 🚀 Quick Deploy - 3 Simple Steps

## Step 1: MongoDB Atlas (5 min)
1. Go to https://cloud.mongodb.com
2. Create free cluster (M0)
3. Create database user
4. Allow access from anywhere (0.0.0.0/0)
5. Copy connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/delore
   ```

## Step 2: Render Deploy (2 min)
1. Go to https://render.com
2. Click "New +" → "Blueprint"
3. Connect: `ibrahim-sultan/deloreApp`
4. Set `MONGODB_URI` to your connection string from Step 1
5. Click "Apply"

## Step 3: Create Admin (1 min)
Visit: `https://your-api-url.onrender.com/api/auth/create-admin`

**Login Credentials:**
- Email: `admin@delore.com`
- Password: `delore@123`

---

## ✅ That's It!

Your app will be live at: `https://delore-portal.onrender.com`

**IMPORTANT**: Change admin password after first login!

---

## 📚 Full Guide
See `RENDER_DEPLOYMENT_GUIDE.md` for detailed instructions and troubleshooting.
