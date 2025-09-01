import React, { useState, useContext } from 'react';
import { Modal, View, Pressable, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootContext } from '../../context/RootContext';
import { hideBusinessModal } from '../../context/reducer';
import { BusinessQuickInfo } from './BusinessQuickInfo';
import { BusinessDetails } from './BusinessDetails';
import AppStyles from '../../AppStyles';

export function BusinessCardModal() {
  const { state, dispatch } = useContext(RootContext);
  const [showDetails, setShowDetails] = useState(false);
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Calculate modal container width accounting for safe areas and internal padding
  const H_PADDING = 16 + insets.left + insets.right; // matches content padding
  const modalMaxWidth = Math.min(700, Math.max(320, Math.floor(winW - H_PADDING * 2)));

  // Calculate a taller modal max height using window height and safe areas
  const V_MARGIN = 24; // top/bottom breathing space outside the sheet
  const modalMaxHeight = Math.floor(winH - insets.top - insets.bottom - V_MARGIN * 2);

  const { isBusinessModalOpen, selectedBusiness } = state;

  if (!selectedBusiness) {
    return null;
  }

  const handleBackdropPress = () => {
    setShowDetails(false); // Reset tab state when closing
    dispatch(hideBusinessModal());
  };

  const handleDetailsPress = () => {
    setShowDetails(true);
  };

  const handleClosePress = () => {
    setShowDetails(false); // Reset tab state when closing
    dispatch(hideBusinessModal());
  };

  return (
    <Modal
      visible={isBusinessModalOpen}
      transparent
      animationType="fade"
      onRequestClose={handleBackdropPress}
    >
      <Pressable
        style={styles.backdrop}
        onPress={handleBackdropPress}
        testID="modal-backdrop"
      >
        <View style={styles.modalContainer}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modal, { maxWidth: modalMaxWidth, width: '100%', maxHeight: modalMaxHeight }]}>
              {/* Tab buttons */}
              <View style={styles.tabContainer}>
                <Pressable
                  onPress={() => setShowDetails(false)}
                  testID="quick-info-tab"
                  style={[styles.tab, !showDetails && styles.activeTab]}
                >
                  <Text style={[styles.tabText, !showDetails && styles.activeTabText]}>
                    Quick Info
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowDetails(true)}
                  testID="details-tab"
                  style={[styles.tab, showDetails && styles.activeTab]}
                >
                  <Text style={[styles.tabText, showDetails && styles.activeTabText]}>
                    Details
                  </Text>
                </Pressable>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                showsVerticalScrollIndicator={true}
                contentInsetAdjustmentBehavior="always"
                keyboardShouldPersistTaps="handled"
              >
                {showDetails ? (
                  <BusinessDetails 
                    business={selectedBusiness} 
                    onClose={handleClosePress}
                  />
                ) : (
                  <BusinessQuickInfo 
                    business={selectedBusiness} 
                    onDetails={handleDetailsPress}
                    onClose={handleClosePress}
                  />
                )}
              </ScrollView>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  modal: {
    backgroundColor: AppStyles.color.white,
    borderRadius: 20,
    alignSelf: 'center',
    shadowColor: AppStyles.color.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: AppStyles.color.greylight + '40',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: AppStyles.color.roulette.gold,
  },
  tabText: {
    fontSize: 16,
    fontFamily: AppStyles.fonts.medium,
    color: AppStyles.color.greylight,
  },
  activeTabText: {
    color: AppStyles.color.roulette.gold,
    fontFamily: AppStyles.fonts.bold,
  },
  content: {
    maxHeight: '100%',
    minWidth: '95%',
    // ScrollView gets padding via contentContainerStyle to avoid double padding
  },
});