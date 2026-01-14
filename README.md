# Sumo Knowledge Share & Tournament

An interactive web presentation about sumo wrestling with a mock tournament feature.

## Features

- **Educational Content**: Learn about sumo history, structure, and cultural elements
- **Interactive Tournament**: Participants can register and select wrestlers
- **Video Matches**: Watch predetermined matches between selected wrestlers
- **Tournament Bracket**: Track progress through round-robin matches
- **Final Results**: See tournament standings and winners

## Setup Instructions

1. **Add Images**: Place the following images in the `images/` folder:
   - `sumo-hero.jpg` - Main hero image for homepage
   - `dohyo-diagram.jpg` - Diagram of the sumo ring
   - Wrestler photos: `hakuho.jpg`, `kakuryu.jpg`, `terunofuji.jpg`, etc.
   - `default-wrestler.jpg` - Fallback image for wrestlers

2. **Add Videos**: Place match videos in the `videos/` folder:
   - Name them according to the matchup: `hakuho-vs-kakuryu.mp4`
   - Include a `default-match.mp4` as fallback

3. **Customize Content**: 
   - Update wrestler data in `script.js` with your preferred wrestlers
   - Modify match video mappings to match your video files
   - Adjust tournament logic if needed

## How to Use

1. Open `index.html` in a web browser
2. Navigate through the educational sections using the navigation menu
3. For the tournament:
   - Participants register with name and email
   - Each participant selects a wrestler (no duplicates allowed)
   - Watch matches in order through the bracket
   - View final tournament results

## Tournament Rules

- Round-robin format: everyone faces everyone
- Match outcomes are predetermined (participants don't know results)
- Winner is determined by total wins
- Ties broken by head-to-head results

## Technical Details

- Pure HTML/CSS/JavaScript (no frameworks required)
- Responsive design for mobile and desktop
- Video playback for match viewing
- Local storage can be added for persistence

## Future Enhancements

- Add sound effects for matches
- Include wrestler statistics and profiles
- Implement betting or prediction features
- Add animations for bracket progression
- Store results in a database