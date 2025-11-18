import React, {useState} from 'react';
import {Modal, View, Image, Pressable, Text, StyleSheet, useWindowDimensions} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import AppStyles from '../../AppStyles';

interface ImageViewerModalProps {
    visible: boolean;
    images: string[];
    initialIndex?: number;
    onClose: () => void;
}

export default function ImageViewerModal({visible, images, initialIndex = 0, onClose}: ImageViewerModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const {width, height} = useWindowDimensions();

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    const handleClose = () => {
        setCurrentIndex(initialIndex); // Reset to initial index when closing
        onClose();
    };

    if (!images || images.length === 0) {
        return null;
    }

    const currentImage = images[currentIndex];
    const showNavigation = images.length > 1;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Close button */}
                <Pressable
                    style={styles.closeButton}
                    onPress={handleClose}
                    android_ripple={{
                        color: 'rgba(255,255,255,0.3)',
                        radius: 24,
                        borderless: true,
                    }}
                >
                    <MaterialIcons name="close" size={32} color={AppStyles.color.white}/>
                </Pressable>

                {/* Image counter */}
                {showNavigation && (
                    <View style={styles.counterContainer}>
                        <Text style={styles.counterText}>
                            {currentIndex + 1} / {images.length}
                        </Text>
                    </View>
                )}

                {/* Backdrop - tap to close */}
                <Pressable
                    style={styles.backdrop}
                    onPress={handleClose}
                >
                    {/* Image container - stop propagation so tapping image doesn't close */}
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <Image
                            source={{uri: currentImage}}
                            style={{
                                width: width - 40,
                                height: height - 200,
                            }}
                            resizeMode="contain"
                        />
                    </Pressable>
                </Pressable>

                {/* Navigation arrows */}
                {showNavigation && (
                    <>
                        <Pressable
                            style={[styles.navButton, styles.navButtonLeft]}
                            onPress={handlePrevious}
                            android_ripple={{
                                color: 'rgba(255,255,255,0.3)',
                                radius: 28,
                                borderless: true,
                            }}
                        >
                            <MaterialIcons name="chevron-left" size={40} color={AppStyles.color.white}/>
                        </Pressable>

                        <Pressable
                            style={[styles.navButton, styles.navButtonRight]}
                            onPress={handleNext}
                            android_ripple={{
                                color: 'rgba(255,255,255,0.3)',
                                radius: 28,
                                borderless: true,
                            }}
                        >
                            <MaterialIcons name="chevron-right" size={40} color={AppStyles.color.white}/>
                        </Pressable>
                    </>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 24,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    counterText: {
        color: AppStyles.color.white,
        fontSize: 16,
        fontFamily: AppStyles.fonts.semiBold,
    },
    navButton: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 28,
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    navButtonLeft: {
        left: 20,
    },
    navButtonRight: {
        right: 20,
    },
});
