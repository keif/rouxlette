import React, {useContext, useState, useEffect} from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RootContext} from '../../context/RootContext';
import {hideBusinessModal, requestSpin} from '../../context/reducer';
import {navigate} from '../../navigation';
import AppStyles from '../../AppStyles';
import {supperClub} from '../../theme/supperClub';
import FlipCard from './FlipCard';
import StarRating from './StarRating';
import OpenSign from '../results/OpenSign';
import {FontAwesome, Ionicons, MaterialIcons} from '@expo/vector-icons';
import {useBusinessDetails} from '../../hooks/useBusinessDetails';
import useBusinessHours from '../../hooks/useBusinessHours';
import {useBlockFavorite} from '../../hooks/useBlockFavorite';
import {BusinessProps} from '../../hooks/useResults';
import ImageViewerModal from './ImageViewerModal';
import {radius} from "../../theme";
import { InteractiveCategoryTag } from './InteractiveCategoryTag';
import { logSafe } from '../../utils/log';

// Helper function to format distance
const formatDistance = (meters: number): string => {
    const miles = meters * 0.000621371;
    return `${miles.toFixed(1)} mi`;
};

export function BusinessCardModal() {
    const {state, dispatch} = useContext(RootContext);
    const {width: winW, height: winH} = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const [isFlipped, setIsFlipped] = useState(false);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [respinning, setRespinning] = useState(false);

    const {isBusinessModalOpen, selectedBusiness, businessModalSource, spinHistory} = state;
    // The action bar (Spin Again / View All) only belongs on the roulette-winner
    // modal — not on plain detail views opened from Search / History / Favorites.
    const isSpinWinner = businessModalSource === 'spin';

    // Detect when a requested re-spin has landed: handleAutoSpinComplete on Home
    // prepends a new spinHistory entry (a fresh object) and updates the winner.
    // Comparing the head reference is cap-safe (spinHistory is capped at 10).
    const respinBaselineRef = React.useRef<unknown>(undefined);
    useEffect(() => {
        if (respinning && spinHistory[0] !== respinBaselineRef.current) {
            setRespinning(false);
            setIsFlipped(false);
        }
    }, [spinHistory, respinning]);

    // Convert to BusinessProps for hooks
    const businessForHook: BusinessProps | null = selectedBusiness ? {
        id: selectedBusiness.id,
        name: selectedBusiness.name,
        image_url: selectedBusiness.image_url || '',
        rating: selectedBusiness.rating || 0,
        price: selectedBusiness.price || '',
        location: selectedBusiness.location || {city: '', display_address: [], address1: ''},
        categories: selectedBusiness.categories || [],
        is_closed: selectedBusiness.is_closed || false,
        coordinates: selectedBusiness.coordinates,
        url: selectedBusiness.url || '',
        phone: selectedBusiness.phone || '',
        display_phone: selectedBusiness.display_phone || '',
        alias: selectedBusiness.alias || '',
        distance: selectedBusiness.distance || 0,
        photos: selectedBusiness.photos || [],
        review_count: selectedBusiness.review_count || 0,
        transactions: selectedBusiness.transactions || [],
        hours: selectedBusiness.hours || [],
    } : null;

    // Hooks - auto-fetch details when modal opens so we have accurate hours data
    const {
        business: enrichedBusiness,
        loading: detailsLoading,
        fetchDetails,
        hasDetails
    } = useBusinessDetails(businessForHook || {} as BusinessProps, true);
    const {todayLabel, isOpen} = useBusinessHours(enrichedBusiness.hours);
    const {isFavorite, isBlocked, handleFavorite, handleBlock} = useBlockFavorite();

    const handleBlockPress = () => {
        if (businessForHook) {
            logSafe('[BusinessCardModal] Block pressed', { id: businessForHook.id, name: businessForHook.name });
            handleBlock(businessForHook);
        }
    };

    const handleFavoritePress = () => {
        if (businessForHook) {
            logSafe('[BusinessCardModal] Favorite pressed', { id: businessForHook.id, name: businessForHook.name });
            handleFavorite(businessForHook);
        }
    };

    // Hours status is determined by: selectedBusiness.hours?.[0]?.is_open_now ?? isOpen ?? null
    // This gives us three states: true (open), false (closed), null (unknown)

    if (!selectedBusiness || !businessForHook) {
        return null;
    }

    const business = selectedBusiness;
    // If we have hours data, use it; if enriched data has isOpen, use that; otherwise null (hours unknown)
    const is_open_now = business.hours?.[0]?.is_open_now ?? isOpen ?? null;

    const handleBackdropPress = () => {
        // Don't let a stray backdrop tap dismiss mid-spin.
        if (respinning) return;
        setIsFlipped(false);
        dispatch(hideBusinessModal());
    };

    // "Spin Again": fade the card out to a translucent backdrop, ask Home to
    // re-spin the wheel (visible behind), and reveal the new winner on landing.
    const handleSpinAgain = () => {
        // Nothing to spin (e.g. filters removed every match) → Home's handleSpin
        // would no-op and never land, so don't enter the spinning state at all.
        if (!state.results || state.results.length === 0) return;
        respinBaselineRef.current = spinHistory[0];
        setIsFlipped(false);
        setRespinning(true);
        dispatch(requestSpin());
    };

    // Failsafe: never trap the user on the "Spinning…" overlay. If a requested
    // spin doesn't land within a few seconds (Home couldn't spin, no handler,
    // etc.), restore the card so it stays dismissable.
    useEffect(() => {
        if (!respinning) return;
        const timeout = setTimeout(() => setRespinning(false), 5000);
        return () => clearTimeout(timeout);
    }, [respinning]);

    // "View All": close the winner modal and jump to the results list.
    const handleViewAll = () => {
        setIsFlipped(false);
        dispatch(hideBusinessModal());
        navigate('Search');
    };

    const handleClosePress = () => {
        setIsFlipped(false);
        dispatch(hideBusinessModal());
    };

    const handleFlip = (flipped: boolean) => {
        setIsFlipped(flipped);
        if (flipped && !hasDetails) {
            fetchDetails();
        }
    };

    const handlePhotoPress = (index: number) => {
        setSelectedImageIndex(index);
        setImageViewerVisible(true);
    };

    const handleMapsPress = () => {
        const address = business.location?.display_address?.join(', ') || '';
        const encodedAddress = encodeURIComponent(address);

        if (Platform.OS === 'ios') {
            Linking.openURL(`http://maps.apple.com/?q=${encodedAddress}`);
        } else {
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
        }
    };

    const handleYelpPress = () => {
        if (business.url) {
            Linking.openURL(business.url);
        }
    };

    const handlePhonePress = () => {
        if (business.phone) {
            Linking.openURL(`tel:${business.phone}`);
        }
    };

    // Calculate dimensions
    const H_PADDING = 16 + insets.left + insets.right;
    const modalMaxWidth = Math.min(700, Math.max(320, Math.floor(winW - H_PADDING * 2)));
    const imageSize = modalMaxWidth - 24;
    const cardMinHeight = imageSize / 2 + 120;

    // Format info for back card
    const distanceText = business.distance ? formatDistance(business.distance) : '';
    const hoursDisplay = hasDetails && todayLabel !== 'Hours unavailable' ? todayLabel : (is_open_now ? 'Open Now' : 'Closed');
    const quickInfo = [business.price, distanceText, hoursDisplay].filter(Boolean).join(' • ');

    const frontContent = (
        <View style={[styles.cardContent, {minHeight: cardMinHeight}]}>
            <View style={styles.imageContainer}>
                {business.image_url ? (
                    <Image
                        style={{height: imageSize / 2, width: imageSize}}
                        source={{uri: business.image_url}}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.noImage, {height: imageSize / 2, width: imageSize}]}>
                        <Text style={styles.noImageText}>No Image</Text>
                    </View>
                )}
                <View style={styles.actionButtonsContainer}>
                    <Pressable
                        style={styles.actionButton}
                        onPress={handleBlockPress}
                        android_ripple={{
                            color: "rgba(255,255,255,0.3)",
                            radius: 20,
                            borderless: true,
                        }}
                        accessibilityLabel={isBlocked(business.id) ? "Remove from block list" : "Block this restaurant"}
                    >
                        <MaterialIcons
                            name={isBlocked(business.id) ? "block" : "block"}
                            size={24}
                            color={isBlocked(business.id) ? supperClub.error : "#FFFFFF"}
                            style={styles.iconAction}
                        />
                    </Pressable>
                    <Pressable
                        style={styles.actionButton}
                        onPress={handleFavoritePress}
                        android_ripple={{
                            color: "rgba(255,255,255,0.3)",
                            radius: 20,
                            borderless: true,
                        }}
                        accessibilityLabel={isFavorite(business.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                        <Ionicons
                            name={isFavorite(business.id) ? "heart" : "heart-outline"}
                            size={24}
                            color={isFavorite(business.id) ? AppStyles.color.yelp : "#FFFFFF"}
                            style={styles.iconAction}
                        />
                    </Pressable>
                </View>
            </View>
            <View style={styles.detail}>
                <View style={styles.detailHeader}>
                    <Text style={styles.name} numberOfLines={2}>{business.name}</Text>
                    <Text style={{fontSize: 22, fontFamily: AppStyles.fonts.semiBold, color: supperClub.gold}}>
                        {business.price}
                    </Text>
                </View>
                <View style={{flexDirection: "row"}}>
                    <Text style={styles.subText} numberOfLines={1}>
                        {business.categories?.map(cat => cat.title).join(', ')} • {business.location?.city}
                    </Text>
                </View>
                <View style={{flexDirection: "row", marginTop: 4}}>
                    <StarRating rating={business.rating || 0}/>
                    <Text style={styles.review}>{business.review_count} Reviews</Text>
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
                <MaterialIcons name="info" size={28} color={supperClub.gold}/>
            </Pressable>
        </View>
    );

    const backContent = (
        <View style={styles.cardContent}>
            <View style={styles.backHeader}>
                <Text style={styles.backTitle} numberOfLines={2}>{business.name}</Text>
                <OpenSign is_open_now={is_open_now}/>
            </View>

            {quickInfo && (
                <View style={styles.quickInfo}>
                    <Text style={styles.quickInfoText}>{quickInfo}</Text>
                </View>
            )}

            <View style={styles.backRating}>
                <StarRating rating={business.rating || 0}/>
                <Text
                    style={styles.backReviewText}>{business.review_count} Review{business.review_count > 1 ? 's' : ''}</Text>
            </View>

            {detailsLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={supperClub.gold}/>
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
                            <View style={styles.photoOverlay}>
                                <MaterialIcons name="zoom-out-map" size={20} color={"#FFFFFF"}/>
                            </View>
                        </Pressable>
                    ))}
                </View>
            )}

            <View style={styles.backDetails}>
                <Text style={styles.backDetailText}>
                    <MaterialIcons name="location-on" size={16} color={supperClub.gold}/>
                    {' '}{business.location?.display_address?.join(', ')}
                </Text>

                {business.phone && (
                    <Text style={styles.backDetailText}>
                        <MaterialIcons name="phone" size={16} color={supperClub.gold}/>
                        {' '}{business.display_phone}
                    </Text>
                )}

                {business.categories && business.categories.length > 0 && (
                    <View style={styles.categoriesContainer}>
                        <View style={styles.categoriesHeader}>
                            <MaterialIcons name="category" size={16} color={supperClub.gold}/>
                            <Text style={styles.categoriesHeaderText}>Categories</Text>
                        </View>
                        <View style={styles.categoriesTags}>
                            {business.categories.map((cat) => (
                                <InteractiveCategoryTag
                                    key={cat.alias}
                                    alias={cat.alias}
                                    title={cat.title}
                                />
                            ))}
                        </View>
                    </View>
                )}
            </View>

            <View style={{flex: 1}}/>

            <View style={styles.backActions}>
                <Pressable
                    style={({pressed}) => [
                        styles.backButton,
                        {opacity: Platform.OS !== 'android' && pressed ? 0.6 : 1},
                    ]}
                    onPress={handleMapsPress}
                    android_ripple={{
                        color: "grey",
                        radius: 28,
                        borderless: true,
                    }}
                >
                    <MaterialIcons
                        color={supperClub.gold}
                        name="map"
                        size={20}
                    />
                    <Text style={styles.backButtonText}>Maps</Text>
                </Pressable>

                <Pressable
                    style={({pressed}) => [
                        styles.backButton,
                        {opacity: Platform.OS !== 'android' && pressed ? 0.6 : 1},
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

                {business.phone && (
                    <Pressable
                        style={({pressed}) => [
                            styles.backButton,
                            {opacity: Platform.OS !== 'android' && pressed ? 0.6 : 1},
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
                    <MaterialIcons name="rotate-left" size={28} color={supperClub.gold}/>
                </Pressable>
            </View>
        </View>
    );

    return (
        <>
            <Modal
                visible={isBusinessModalOpen}
                transparent
                animationType="fade"
                onRequestClose={handleBackdropPress}
            >
                <Pressable
                    style={[styles.backdrop, respinning && styles.backdropRespinning]}
                    onPress={handleBackdropPress}
                    testID="modal-backdrop"
                >
                    <View style={styles.modalContainer}>
                        {respinning ? (
                            // Card fades to a translucent backdrop so Home's wheel
                            // is visible spinning behind; a hint sits at the bottom.
                            <View style={styles.respinningHintWrap} pointerEvents="none">
                                <Text style={styles.respinningHint}>Spinning the wheel…</Text>
                            </View>
                        ) : (
                        <Pressable onPress={(e) => e.stopPropagation()} style={styles.contentColumn}>
                            <View style={{maxWidth: modalMaxWidth, width: modalMaxWidth}}>
                                <FlipCard
                                    front={frontContent}
                                    back={backContent}
                                    style={styles.flipCard}
                                    flipped={isFlipped}
                                    onFlipChange={handleFlip}
                                    disableTapToFlip={true}
                                    disableSwipeToFlip={true}
                                />
                            </View>
                            {isSpinWinner && (
                                <View style={[styles.actionBar, {maxWidth: modalMaxWidth, width: modalMaxWidth}]}>
                                    <Pressable
                                        style={({pressed}) => [styles.winnerActionButton, styles.winnerActionPrimary, pressed && styles.winnerActionPressed]}
                                        onPress={handleSpinAgain}
                                        testID="modal-spin-again"
                                        accessibilityRole="button"
                                        accessibilityLabel="Spin again"
                                    >
                                        <Ionicons name="refresh" size={18} color="#FFFFFF"/>
                                        <Text style={styles.winnerActionPrimaryText}>Spin Again</Text>
                                    </Pressable>
                                    <Pressable
                                        style={({pressed}) => [styles.winnerActionButton, styles.winnerActionSecondary, pressed && styles.winnerActionPressed]}
                                        onPress={handleViewAll}
                                        testID="modal-view-all"
                                        accessibilityRole="button"
                                        accessibilityLabel="View all results"
                                    >
                                        <Ionicons name="list" size={18} color={supperClub.gold}/>
                                        <Text style={styles.winnerActionSecondaryText}>View All</Text>
                                    </Pressable>
                                </View>
                            )}
                        </Pressable>
                        )}
                    </View>
                </Pressable>
            </Modal>

            {/* Image Viewer Modal */}
            <ImageViewerModal
                visible={imageViewerVisible}
                images={enrichedBusiness.photos || []}
                initialIndex={selectedImageIndex}
                onClose={() => setImageViewerVisible(false)}
            />
        </>
    );
}

const textStyle = {
    color: supperClub.textMuted,
    fontFamily: AppStyles.fonts.regular,
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(6,3,4,0.66)',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    flipCard: {
        // Empty - let content handle its own styling for 3D flip effect
    },
    backdropRespinning: {
        // Translucent so Home's roulette wheel is visible spinning behind.
        backgroundColor: 'rgba(6,3,4,0.28)',
    },
    respinningHintWrap: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 96,
    },
    respinningHint: {
        color: supperClub.text,
        fontFamily: AppStyles.fonts.medium,
        fontSize: 15,
        letterSpacing: 0.3,
        opacity: 0.92,
    },
    contentColumn: {
        alignItems: 'center',
    },
    actionBar: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    winnerActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        minHeight: 48,
    },
    winnerActionPrimary: {
        backgroundColor: supperClub.primary,
    },
    winnerActionSecondary: {
        backgroundColor: supperClub.surfaceElevated,
        borderWidth: 1,
        borderColor: supperClub.borderSoft,
    },
    winnerActionPressed: {
        opacity: 0.85,
    },
    winnerActionPrimaryText: {
        color: '#FFFFFF',
        fontFamily: AppStyles.fonts.medium,
        fontSize: 15,
    },
    winnerActionSecondaryText: {
        color: supperClub.gold,
        fontFamily: AppStyles.fonts.medium,
        fontSize: 15,
    },
    cardContent: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: supperClub.background,
        borderWidth: 1,
        borderColor: supperClub.borderSoft,
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
        backgroundColor: supperClub.surfaceElevated,
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
        flexDirection: "row",
        gap: 8,
    },
    actionButton: {
        padding: 8,
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    iconAction: {
        textShadowColor: AppStyles.color.black,
        textShadowOffset: {
            width: 0,
            height: 0,
        },
        textShadowRadius: 4,
    },
    imageContainer: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: "hidden",
    },
    noImage: {
        backgroundColor: supperClub.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        fontSize: 18,
        fontFamily: AppStyles.fonts.medium,
        color: supperClub.textMuted,
    },
    name: {
        color: supperClub.textPrimary,
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
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        // Dark header (not magenta) so OpenSign's red "closed" / green "open"
        // status stays legible; magenta reads as an accent, not a fill here.
        backgroundColor: supperClub.surfaceElevated,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: supperClub.borderSoft,
    },
    backTitle: {
        color: "#FFFFFF",
        fontSize: 20,
        fontFamily: AppStyles.fonts.semiBold,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
    },
    quickInfo: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
    },
    quickInfoText: {
        fontSize: 14,
        fontFamily: AppStyles.fonts.medium,
        color: supperClub.text,
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
        color: supperClub.gold,
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
    categoriesContainer: {
        marginTop: 8,
    },
    categoriesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoriesHeaderText: {
        ...textStyle,
        fontSize: 15,
        marginLeft: 4,
        lineHeight: 20,
    },
    categoriesTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
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
        backgroundColor: supperClub.surfaceElevated,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        shadowColor: '#000',
        ...AppStyles.ButtonPressable,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: supperClub.borderSoft,
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    backButtonText: {
        marginLeft: 6,
        fontSize: 14,
        fontFamily: AppStyles.fonts.medium,
        color: supperClub.text,
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
