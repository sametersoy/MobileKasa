import TrackPlayer from 'react-native-track-player';



TrackPlayer.setupPlayer();

export async function CallMusicStart() {

    await TrackPlayer.reset();
    await TrackPlayer.add({
        id: 'trackId',
        url: require('../../MobilKasa/Assets/Barcode-scanner-beep-sound.mp3'),
        title: 'Track Title',
        artist: 'Track Artist',
    });
    await TrackPlayer.play();

}

export default CallMusicStart