# Rouxlette

## _The mobile app to help you choose what you want to eat._

The main problem I have with "finding food" is always the inevitable conversation of "I'm hungry, but I don't want _X_."
So I decided made an app for that - utilizing React Native/Expo to modernize the tech stack, and in its infancy, the
goal is to be as low requirement as possible.

### Current State:

- Utilizes the Yelp (for restaurant search) and Google (for geolocation) APIs
- Only uses localStorage for cache
- Not 100% perfect, little glaring errors and broken functionality. It's a personal project, you aren't paying for this.

### Future State:

- local profiles (create one for you/your usual lunch crowds and their food preferences)
- save preferences
- hide restaurants by search (make it easier to filter down)
- sharing suggestions
- map integration
- additional API integrations (whatever I can find - tying to delivery apps, etc.)
  - open table, resy, toast, uberEats, etc. api
- basically, all the issues I've had with Yelp over the years that they haven't fixed as I dive more into their API and
  others.
- Filter enhancements:
  - Pricing per person or overall cost
  - Removing certain cuisines-i want Mexican I don’t want sushi
  - Distance?
  - Ratings by other users (ie. I only want 4 stars and above)
  - A way to track where I’ve gone and then filter by “new to me”
- "Maybe Next Time": a subset of favorites, to keep certain ones at the top of the list.

## Contributing

See the contributor guide in [AGENTS.md](./AGENTS.md) for project structure, test commands, and PR expectations.
