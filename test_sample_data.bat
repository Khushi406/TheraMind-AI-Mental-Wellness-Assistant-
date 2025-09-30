# TheraMind Wellness - Sample Data for Testing
# Copy and paste these curl commands to populate your database with test data
# Make sure your server is running on http://localhost:5000 first

# 1. Create a test user
echo "Creating test user..."
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser\",\"password\":\"password123\",\"email\":\"test@example.com\"}"

echo.
echo "Logging in test user..."
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser\",\"password\":\"password123\"}"

echo.
echo "=== Copy the token from above and replace YOUR_TOKEN_HERE in the commands below ==="
echo.

# 2. Create journal entries (replace YOUR_TOKEN_HERE with actual token)
echo "Creating journal entry 1 - Happy Day..."
curl -X POST http://localhost:5000/api/journal ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"content\":\"Today was such a wonderful day! I finally finished my project at work and my team was really impressed. I feel so accomplished and proud of what I've achieved. The sun was shining, and I took a walk in the park during lunch. Everything just felt perfect and I'm grateful for this moment of pure happiness.\",\"emotions\":[{\"label\":\"joy\",\"score\":0.9},{\"label\":\"pride\",\"score\":0.8},{\"label\":\"gratitude\",\"score\":0.85}],\"reflection\":\"This feeling of accomplishment reminds me that hard work really does pay off. I should celebrate these wins more often.\"}"

echo.
echo "Creating journal entry 2 - Overwhelmed..."
curl -X POST http://localhost:5000/api/journal ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"content\":\"I'm feeling really overwhelmed today. Work has been piling up, and I don't know how I'm going to get everything done. My manager keeps adding more tasks, and I feel like I'm drowning. I couldn't sleep well last night because I was thinking about all the deadlines.\",\"emotions\":[{\"label\":\"anxiety\",\"score\":0.85},{\"label\":\"stress\",\"score\":0.9},{\"label\":\"overwhelm\",\"score\":0.8}],\"reflection\":\"Maybe I need to talk to my manager about workload management. It's okay to ask for help when I need it.\"}"

echo.
echo "Creating journal entry 3 - Social Connection..."
curl -X POST http://localhost:5000/api/journal ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"content\":\"Had lunch with my best friend today after months of not seeing each other. We laughed so much and caught up on everything that's been happening in our lives. It felt so good to connect with someone who really understands me.\",\"emotions\":[{\"label\":\"joy\",\"score\":0.8},{\"label\":\"love\",\"score\":0.7},{\"label\":\"connection\",\"score\":0.9}],\"reflection\":\"I should make more effort to maintain my friendships. They bring so much joy and meaning to my life.\"}"

echo.
echo "Creating journal entry 4 - Mistake at Work..."
curl -X POST http://localhost:5000/api/journal ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"content\":\"I made a mistake at work today that cost the company some money. I feel terrible about it and keep replaying what happened in my mind. My supervisor was understanding, but I can't shake this feeling of guilt.\",\"emotions\":[{\"label\":\"guilt\",\"score\":0.8},{\"label\":\"disappointment\",\"score\":0.75},{\"label\":\"shame\",\"score\":0.7}],\"reflection\":\"Everyone makes mistakes. This is a learning opportunity, and I'll be more careful next time.\"}"

echo.
echo "Creating journal entry 5 - Reading Joy..."
curl -X POST http://localhost:5000/api/journal ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  -d "{\"content\":\"Started reading a new book today and I'm already completely absorbed in it. There's something magical about discovering a story that captivates you from the first page. I spent hours reading and completely lost track of time.\",\"emotions\":[{\"label\":\"excitement\",\"score\":0.8},{\"label\":\"curiosity\",\"score\":0.9},{\"label\":\"wonder\",\"score\":0.75}],\"reflection\":\"Reading brings me so much joy. I should make more time for books and hobbies that truly engage my mind.\"}"

echo.
echo "=== Sample data creation completed! ==="
echo "You can now test your TheraMind Wellness app with:"
echo "- Username: testuser"
echo "- Password: password123"
echo "- 5 diverse journal entries with different emotions"