# 3D Football Simulation - 11v11

A beautiful, interactive 3D football (soccer) simulation in the browser featuring 11 players per team, realistic pitch, stadium, goalposts with nets, and a live scoreboard.

## Features

✨ **Gameplay**
- 11v11 players with realistic team formations (4-3-3)
- 3-minute halves with pause functionality
- Live scoreboard with match time
- Dynamic ball physics with gravity and collision detection
- Simple AI player movement

🏟️ **Stadium Elements**
- Professional football pitch with regulation markings
- Goal areas and center circle
- Simple stadium stands
- Realistic goalposts with crossbars
- Goal nets

🎮 **Controls**
- **Arrow Keys**: Navigate camera
- **SPACE**: Pass/Shoot (when enabled)
- **P**: Pause/Resume match

📱 **Responsive Design**
- Optimized for mobile landscape orientation
- Scalable UI and camera system
- Touch-friendly controls (expandable)

## Technical Stack

- **Three.js**: 3D rendering engine
- **WebGL**: Hardware-accelerated graphics
- **GLTF**: 3D model format support
- **Vanilla JavaScript**: No dependencies

## Asset Models

The simulation uses the following player animation models:
- `PlayerIdleStand.glb` - Idle stance
- `RunningForward.glb` - Running animation
- `walkForward.glb` - Walking animation
- `SlideTackle.glb` - Tackle animation

## Setup

1. Clone the repository
2. Replace model URLs in `game.js` with your actual model paths
3. Open `index.html` in a modern web browser
4. Enjoy the simulation!

## Customization

### Modify Game Settings
Edit the `CONFIG` object in `game.js`:
```javascript
const CONFIG = {
    PITCH_WIDTH: 100,      // Pitch width
    PITCH_HEIGHT: 68,      // Pitch length
    HALF_TIME: 180,        // 3 minutes in seconds
    STADIUM_SIZE: 150,     // Stadium dimensions
    PLAYER_HEIGHT: 1.8,    // Player height in units
};
```

### Adjust Team Formations
Modify the `homeFormation` and `awayFormation` arrays in the `setupPlayers()` function to change player positions.

### Customize Colors
- Team colors: Edit player material colors in `createPlayer()`
- Pitch color: Modify `createStadium()` grass material
- UI colors: Edit `styles.css`

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Tips

- Use WebGL 2.0 for better performance
- Reduce shadow map resolution for mobile devices
- Disable physics calculations for off-screen elements

## Future Enhancements

- [ ] Ball possession and passing mechanics
- [ ] Goal detection and scoring
- [ ] Advanced player AI with pathfinding
- [ ] Player interaction with mouse/touch
- [ ] Sound effects and commentary
- [ ] Multiple camera angles
- [ ] Replay system
- [ ] Network multiplayer

## License

MIT License - Feel free to use and modify

## Author

Developed for web-based 3D football simulation experience.
