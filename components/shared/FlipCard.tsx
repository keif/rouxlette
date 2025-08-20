import React, { useState } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { TapGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  flipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
  style?: ViewStyle;
  flipDurationMs?: number;
}

const FlipCard = ({
  front,
  back,
  flipped: controlledFlipped,
  onFlipChange,
  style,
  flipDurationMs = 300,
}: FlipCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipValue = useSharedValue(0);
  
  const currentFlipped = controlledFlipped !== undefined ? controlledFlipped : isFlipped;
  
  const handleFlip = () => {
    const newFlippedState = !currentFlipped;
    
    if (controlledFlipped === undefined) {
      setIsFlipped(newFlippedState);
    }
    
    if (onFlipChange) {
      onFlipChange(newFlippedState);
    }
    
    flipValue.value = withTiming(newFlippedState ? 1 : 0, {
      duration: flipDurationMs,
    });
  };

  const onTapStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      runOnJS(handleFlip)();
    }
  };

  const onPanStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      // Trigger flip on horizontal swipe (threshold: 50 pixels)
      if (Math.abs(translationX) > 50) {
        runOnJS(handleFlip)();
      }
    }
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipValue.value, [0, 1], [0, 180]);
    const opacity = interpolate(flipValue.value, [0, 0.5, 1], [1, 0, 0]);
    
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity,
      backfaceVisibility: 'hidden',
      pointerEvents: flipValue.value > 0.5 ? 'none' : 'auto',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipValue.value, [0, 1], [180, 0]);
    const opacity = interpolate(flipValue.value, [0, 0.5, 1], [0, 0, 1]);
    
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      opacity,
      backfaceVisibility: 'hidden',
      pointerEvents: flipValue.value < 0.5 ? 'none' : 'auto',
    };
  });

  React.useEffect(() => {
    flipValue.value = withTiming(currentFlipped ? 1 : 0, {
      duration: flipDurationMs,
    });
  }, [currentFlipped, flipDurationMs]);

  return (
    <TapGestureHandler onHandlerStateChange={onTapStateChange}>
      <PanGestureHandler onHandlerStateChange={onPanStateChange}>
        <Animated.View
          style={[
            {
              position: 'relative',
            },
            style,
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityHint="Flip card to see more details"
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: '100%',
                height: '100%',
              },
              frontAnimatedStyle,
            ]}
          >
            {front}
          </Animated.View>
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: '100%',
                height: '100%',
              },
              backAnimatedStyle,
            ]}
          >
            {back}
          </Animated.View>
          {/* Invisible view to maintain height */}
          <Animated.View style={{ opacity: 0 }}>
            {front}
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    </TapGestureHandler>
  );
};

export default FlipCard;