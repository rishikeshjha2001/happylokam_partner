import React from 'react';
import { BackHandler } from 'react-native';
import CustomAlert from './CustomAlert';

export interface ExitConfirmModalProps {
  visible: boolean;
  onCancel?: () => void;
  onClose?: () => void;
  onExit?: () => void;
}

export default function ExitConfirmModal({ visible, onCancel, onClose, onExit }: ExitConfirmModalProps) {
  const dismiss = onCancel || onClose || (() => {});

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      BackHandler.exitApp();
    }
  };

  return (
    <CustomAlert
      visible={visible}
      type="exit"
      title="Exit happylokam Partner?"
      message="Are you sure you want to close the application? You can reopen it at any time to manage your business."
      buttons={[
        {
          text: 'Stay in App',
          style: 'cancel',
          onPress: dismiss,
        },
        {
          text: 'Exit App',
          style: 'destructive',
          onPress: handleExit,
        },
      ]}
      onClose={dismiss}
    />
  );
}
