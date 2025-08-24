import React, { useState, useContext } from 'react';
import { Modal, View, Pressable, Text } from 'react-native';
import { RootContext } from '../../context/RootContext';
import { hideBusinessModal } from '../../context/reducer';
import { BusinessQuickInfo } from './BusinessQuickInfo';
import { BusinessDetails } from './BusinessDetails';

export function BusinessCardModal() {
  const { state, dispatch } = useContext(RootContext);
  const [showDetails, setShowDetails] = useState(false);
  
  const { isBusinessModalOpen, selectedBusiness } = state;
  
  if (!selectedBusiness) {
    return null;
  }

  const handleBackdropPress = () => {
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
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        onPress={handleBackdropPress}
        testID="modal-backdrop"
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={{ 
              backgroundColor: 'white', 
              margin: 20, 
              borderRadius: 10, 
              padding: 20, 
              minWidth: 300 
            }}>
              {/* Tab buttons */}
              <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                <Pressable
                  onPress={() => setShowDetails(false)}
                  testID="quick-info-tab"
                  style={{
                    flex: 1,
                    padding: 10,
                    backgroundColor: !showDetails ? '#007AFF' : '#E5E5E7',
                    borderRadius: 5,
                    marginRight: 5,
                  }}
                >
                  <Text style={{
                    color: !showDetails ? 'white' : 'black',
                    textAlign: 'center',
                    fontWeight: !showDetails ? 'bold' : 'normal',
                  }}>
                    Quick Info
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowDetails(true)}
                  testID="details-tab"
                  style={{
                    flex: 1,
                    padding: 10,
                    backgroundColor: showDetails ? '#007AFF' : '#E5E5E7',
                    borderRadius: 5,
                    marginLeft: 5,
                  }}
                >
                  <Text style={{
                    color: showDetails ? 'white' : 'black',
                    textAlign: 'center',
                    fontWeight: showDetails ? 'bold' : 'normal',
                  }}>
                    Details
                  </Text>
                </Pressable>
              </View>

              {/* Content */}
              {showDetails ? (
                <BusinessDetails business={selectedBusiness} />
              ) : (
                <BusinessQuickInfo business={selectedBusiness} />
              )}
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}