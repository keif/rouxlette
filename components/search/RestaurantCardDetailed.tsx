import React, {useContext, useEffect, useRef, useState} from "react";
import {Animated, Image, Linking, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, ActivityIndicator} from "react-native";
import {BusinessProps} from "../../hooks/useResults";
import AppStyles from "../../AppStyles";
import {FontAwesome, MaterialIcons} from "@expo/vector-icons";
import StarRating from "../shared/StarRating";
import ActionButtons from "../shared/ActionButtons";
import OpenSign from "../results/OpenSign";
import FlipCard from "../shared/FlipCard";
import Config from "../../Config";
import {logSafe} from "../../utils/log";
import {useBlockFavorite} from "../../hooks/useBlockFavorite";
import {useHistory} from "../../hooks/useHistory";
import {RootContext} from '../../context/RootContext';
import {useBusinessDetails} from "../../hooks/useBusinessDetails";
import useBusinessHours from "../../hooks/useBusinessHours";
import ImageViewerModal from "../shared/ImageViewerModal";

interface RestaurantCardProps {
    index: number;
    result: BusinessProps;
}

// Helper function to format distance
const formatDistance = (meters: number): string => {
    const miles = meters * 0.000621371;
    return `${miles.toFixed(1)} mi`;
};

const RestaurantCard = ({index, result}: RestaurantCardProps) => {
    const {
        categories,
        hours,
        image_url,
        is_closed,
        location,
        name,
        price,
        rating,
        review_count,
        url,
        phone,
        display_phone,
        photos,
        distance
    } = result;
    const {width} = useWindowDimensions();
    const translateY = useRef<Animated.Value>(new Animated.Value(50)).current;
    const opacity = useRef<Animated.Value>(new Animated.Value(0)).current;
    const is_open_now = hours && hours[0]?.is_open_now || false;
    const {isFavorite, isBlocked, handleFavorite, handleBlock} = useBlockFavorite();
    const {addHistoryEntry} = useHistory();

    const handleBlockPress = () => {
        logSafe('[RestaurantCard] Block pressed', { id: result.id, name: result.name });
        handleBlock(result);
    };

    const handleFavoritePress = () => {
        logSafe('[RestaurantCard] Favorite pressed', { id: result.id, name: result.name });
        handleFavorite(result);
    };
    const {state} = useContext(RootContext);
    const [isFlipped, setIsFlipped] = useState(false);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Lazy-load business details (photos, detailed hours)
    const {business: enrichedBusiness, loading: detailsLoading, fetchDetails, hasDetails} = useBusinessDetails(result, false);

    // Format hours for display (uses enriched business hours if available)
    const {todayLabel, isOpen} = useBusinessHours(enrichedBusiness.hours);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 400,
                delay: (400 / 3),
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 400,
                delay: (400 / 3),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Fetch details when card flips to back
    const handleFlip = (flipped: boolean) => {
        setIsFlipped(flipped);
        if (flipped && !hasDetails) {
            fetchDetails();
        }
    };

    // Open image viewer with selected photo
    const handlePhotoPress = (index: number) => {
        setSelectedImageIndex(index);
        setImageViewerVisible(true);
    };

    const handleYelpPress = () => {
        // Track this as a manual selection when user opens Yelp
        addHistoryEntry({
            business: result,
            source: 'manual',
            context: {
                locationText: state.location,
                filters: {
                    openNow: state.filters.openNow,
                    categories: state.filters.categoryIds,
                    priceLevels: state.filters.priceLevels,
                    radiusMeters: state.filters.radiusMeters,
                    minRating: state.filters.minRating,
                },
            },
        });

        Linking
            .openURL(url)
            .catch((err: any) => logSafe("RestaurantCard Yelp link error", {message: err?.message, url}));
    };

    const handlePhonePress = () => {
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    const handleMapsPress = () => {
        // Track this as a manual selection when user opens Maps
        addHistoryEntry({
            business: result,
            source: 'manual',
            context: {
                locationText: state.location,
                filters: {
                    openNow: state.filters.openNow,
                    categories: state.filters.categoryIds,
                    priceLevels: state.filters.priceLevels,
                    radiusMeters: state.filters.radiusMeters,
                    minRating: state.filters.minRating,
                },
            },
        });

        const address = location.display_address.join(', ');
        const encodedAddress = encodeURIComponent(address);

        if (Platform.OS === 'ios') {
            Linking.openURL(`http://maps.apple.com/?q=${encodedAddress}`);
        } else {
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
        }
    };

    const imageSize = width - 24;
    const cardMinHeight = imageSize / 2 + 120; // Image height + approximate detail section height

    // Format additional info for back card
    const distanceText = distance ? formatDistance(distance) : '';
    // Use detailed hours if available, otherwise fallback to basic status
    const hoursDisplay = hasDetails && todayLabel !== 'Hours unavailable' ? todayLabel : (is_open_now ? 'Open Now' : 'Closed');
    const quickInfo = [price, distanceText, hoursDisplay].filter(Boolean).join(' • ');

    const frontContent = (
        <View style={[styles.cardContent, {minHeight: cardMinHeight}]}>
            <View style={styles.imageContainer}>
                <Image
                    style={{height: imageSize / 2, width: imageSize}}
                    source={{uri: image_url}}
                    resizeMode="cover"
                />
                <Text style={styles.index}>{index + 1}.</Text>
                <ActionButtons
                    isBlocked={isBlocked(result.id)}
                    isFavorite={isFavorite(result.id)}
                    onBlockPress={handleBlockPress}
                    onFavoritePress={handleFavoritePress}
                    style={styles.actionButtonsContainer}
                />
            </View>
            <View style={styles.detail}>
                <View style={styles.detailHeader}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={{fontSize: 22, fontFamily: AppStyles.fonts.semiBold,}}>
                        {price}
                    </Text>
                </View>
                <View style={{flexDirection: "row"}}>
                    <Text style={styles.subText} numberOfLines={1}>
                        {categories.map(cat => cat.title).join(`, `)} • {location.city}
                    </Text>
                </View>
                <View style={{flexDirection: "row", marginTop: 4}}>
                    <StarRating rating={rating}/>
                    <Text style={styles.review}>{review_count} Reviews</Text>
                </View>
            </View>
            <Pressable
                style={styles.flipButtonCorner}
                onPress={() => handleFlip(true)}
                android_ripple={{
                    color: "rgba(0,0,0,0.1)",
                    radius: 24,
                    borderless: true,
                }}
                accessibilityLabel="View details"
            >
                <MaterialIcons name="info" size={28} color={AppStyles.color.primary}/>
            </Pressable>
        </View>
    );

    const backContent = (
        <View style={styles.cardContent}>
            <View style={styles.backHeader}>
                <Text style={styles.backTitle}>{name}</Text>
                <OpenSign is_open_now={is_open_now}/>
            </View>

            {quickInfo && (
                <View style={styles.quickInfo}>
                    <Text style={styles.quickInfoText}>{quickInfo}</Text>
                </View>
            )}

            <View style={styles.backRating}>
                <StarRating rating={rating}/>
                <Text style={styles.backReviewText}>{review_count} Review{review_count > 1 ? 's' : ''}</Text>
            </View>

            {detailsLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={AppStyles.color.primary} />
                    <Text style={styles.loadingText}>Loading details...</Text>
                </View>
            )}

            {enrichedBusiness.photos && enrichedBusiness.photos.length > 0 && (
                <View style={styles.photoContainer}>
                    {enrichedBusiness.photos.slice(0, 3).map((photo, idx) => (
                        <Pressable
                            key={idx}
                            onPress={() => handlePhotoPress(idx)}
                            android_ripple={{
                                color: "rgba(0,0,0,0.1)",
                            }}
                            style={styles.photoWrapper}
                        >
                            <Image
                                source={{uri: photo}}
                                style={styles.photo}
                                resizeMode="cover"
                            />
                            {/* Expand icon overlay */}
                            <View style={styles.photoOverlay}>
                                <MaterialIcons name="zoom-out-map" size={20} color={AppStyles.color.white}/>
                            </View>
                        </Pressable>
                    ))}
                </View>
            )}

            <View style={styles.backDetails}>
                <Text style={styles.backDetailText}>
                    <MaterialIcons name="location-on" size={16} color={AppStyles.color.primary}/>
                    {' '}{location.display_address.join(', ')}
                </Text>

                {phone && (
                    <Text style={styles.backDetailText}>
                        <MaterialIcons name="phone" size={16} color={AppStyles.color.primary}/>
                        {' '}{display_phone}
                    </Text>
                )}

                <Text style={styles.backDetailText}>
                    <MaterialIcons name="category" size={16} color={AppStyles.color.primary}/>
                    {' '}{categories.map(cat => cat.title).join(', ')}
                </Text>
            </View>

            <View style={{flex: 1}}/>

            <View style={styles.backActions}>
                <Pressable
                    style={({pressed}) => [
                        styles.backButton,
                        {opacity: !Config.isAndroid && pressed ? 0.6 : 1},
                    ]}
                    onPress={handleMapsPress}
                    android_ripple={{
                        color: "grey",
                        radius: 28,
                        borderless: true,
                    }}
                >
                    <MaterialIcons
                        color={AppStyles.color.primary}
                        name="map"
                        size={20}
                    />
                    <Text style={styles.backButtonText}>Maps</Text>
                </Pressable>

                <Pressable
                    style={({pressed}) => [
                        styles.backButton,
                        {opacity: !Config.isAndroid && pressed ? 0.6 : 1},
                    ]}
                    onPress={handleYelpPress}
                    android_ripple={{
                        color: "grey",
                        radius: 28,
                        borderless: true,
                    }}
                >
                    <FontAwesome
                        color={AppStyles.color.yelp}
                        name="yelp"
                        size={20}
                    />
                    <Text style={styles.backButtonText}>Yelp</Text>
                </Pressable>

                {phone && (
                    <Pressable
                        style={({pressed}) => [
                            styles.backButton,
                            {opacity: !Config.isAndroid && pressed ? 0.6 : 1},
                        ]}
                        onPress={handlePhonePress}
                        android_ripple={{
                            color: "grey",
                            radius: 28,
                            borderless: true,
                        }}
                    >
                        <MaterialIcons
                            color={AppStyles.color.phone}
                            name="phone-in-talk"
                            size={20}
                        />
                        <Text style={styles.backButtonText}>Call</Text>
                    </Pressable>
                )}

                <Pressable
                    style={styles.flipButtonInline}
                    onPress={() => handleFlip(false)}
                    android_ripple={{
                        color: "rgba(0,0,0,0.1)",
                        radius: 24,
                        borderless: true,
                    }}
                    accessibilityLabel="Close details"
                >
                    <MaterialIcons name="rotate-left" size={28} color={AppStyles.color.primary}/>
                </Pressable>
            </View>
        </View>
    );

    return (
        <>
            <Animated.View
                style={[styles.container, {opacity, transform: [{translateY}]}]}
            >
                <FlipCard
                    front={frontContent}
                    back={backContent}
                    style={styles.flipCard}
                    flipped={isFlipped}
                    onFlipChange={handleFlip}
                    disableTapToFlip={true}
                    disableSwipeToFlip={true}
                />
            </Animated.View>

            {/* Image Viewer Modal */}
            <ImageViewerModal
                visible={imageViewerVisible}
                images={enrichedBusiness.photos || []}
                initialIndex={selectedImageIndex}
                onClose={() => setImageViewerVisible(false)}
            />
        </>
    );
};

const textStyle = {
    color: "rgba(128,128,128, 0.80)",
    fontFamily: AppStyles.fonts.regular,
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 12,
        marginVertical: 12,
    },
    flipCard: {
        // Empty - let content handle its own styling for 3D flip effect
    },
    cardContent: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: AppStyles.color.white,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: {
            height: 6,
            width: 0,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    detail: {
        backgroundColor: AppStyles.color.white,
        paddingHorizontal: 16,
        paddingVertical: 6,
        paddingBottom: 16,
    },
    detailHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    actionButtonsContainer: {
        position: "absolute",
        right: 8,
        top: 8,
    },
    imageContainer: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: "hidden",
    },
    index: {
        color: AppStyles.color.white,
        fontSize: 22,
        fontFamily: AppStyles.fonts.semiBold,
        fontWeight: "bold",
        padding: 16,
        position: "absolute",
        left: 0,
        textShadowColor: AppStyles.color.black,
        textShadowOffset: {
            width: 0,
            height: 0,
        },
        textShadowRadius: 6,
    },
    name: {
        color: AppStyles.color.black,
        flex: 1,
        fontSize: 22,
        fontFamily: AppStyles.fonts.semiBold,
        fontWeight: "bold",
        paddingBottom: 6,
        paddingRight: 8,
    },
    subText: {
        ...textStyle,
        flex: 1,
        paddingRight: 4,
    },
    review: {
        ...textStyle,
        marginLeft: 8,
    },
    // Back of card styles
    backHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: AppStyles.color.primary,
    },
    backTitle: {
        color: AppStyles.color.white,
        fontSize: 20,
        fontFamily: AppStyles.fonts.semiBold,
        fontWeight: 'bold',
        flex: 1,
    },
    quickInfo: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
    },
    quickInfoText: {
        fontSize: 14,
        fontFamily: AppStyles.fonts.medium,
        color: AppStyles.color.black,
    },
    backRating: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 2,
    },
    backReviewText: {
        ...textStyle,
        marginLeft: 8,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        fontFamily: AppStyles.fonts.regular,
        color: AppStyles.color.primary,
    },
    photoContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        marginVertical: 8,
    },
    photoWrapper: {
        flex: 1,
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
    },
    photo: {
        width: '100%',
        height: 80,
        borderRadius: 8,
    },
    photoOverlay: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        padding: 4,
    },
    backDetails: {
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    backDetailText: {
        ...textStyle,
        fontSize: 15,
        marginBottom: 6,
        lineHeight: 20,
    },
    backActions: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 8,
        paddingTop: 8,
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    backButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        shadowColor: AppStyles.color.shadow,
        ...AppStyles.ButtonPressable,
        borderRadius: 20,
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    backButtonText: {
        marginLeft: 6,
        fontSize: 14,
        fontFamily: AppStyles.fonts.medium,
        color: AppStyles.color.black,
    },
    flipButtonCorner: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'transparent',
        borderRadius: 24,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flipButtonInline: {
        backgroundColor: 'transparent',
        borderRadius: 24,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 'auto',
    },
});

export default RestaurantCard;