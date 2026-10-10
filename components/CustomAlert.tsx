import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  LogOut,
  Sparkles,
  X,
  ShieldAlert,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export type AlertType = 'success' | 'warning' | 'error' | 'info' | 'confirm' | 'exit';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
}

export interface CustomAlertOptions {
  type?: AlertType;
  title: string;
  message: string;
  buttons?: AlertButton[];
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  visible?: boolean;
}

export interface CustomAlertProps {
  visible?: boolean;
  type?: AlertType;
  title?: string;
  message?: string;
  buttons?: AlertButton[];
  config?: CustomAlertOptions | null;
  onClose?: () => void;
}

const TYPE_CONFIG: Record<
  AlertType,
  { icon: any; color: string; bg: string; border: string; glow: string }
> = {
  success: {
    icon: CheckCircle2,
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.3)',
    glow: 'rgba(52, 211, 153, 0.25)',
  },
  warning: {
    icon: AlertTriangle,
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.12)',
    border: 'rgba(251, 191, 36, 0.3)',
    glow: 'rgba(251, 191, 36, 0.25)',
  },
  error: {
    icon: AlertCircle,
    color: '#f87171',
    bg: 'rgba(248, 113, 113, 0.12)',
    border: 'rgba(248, 113, 113, 0.3)',
    glow: 'rgba(248, 113, 113, 0.25)',
  },
  info: {
    icon: Info,
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.12)',
    border: 'rgba(96, 165, 250, 0.3)',
    glow: 'rgba(96, 165, 250, 0.25)',
  },
  confirm: {
    icon: Sparkles,
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.3)',
    glow: 'rgba(56, 189, 248, 0.25)',
  },
  exit: {
    icon: ShieldAlert,
    color: '#fb7185',
    bg: 'rgba(251, 113, 133, 0.12)',
    border: 'rgba(251, 113, 133, 0.3)',
    glow: 'rgba(251, 113, 133, 0.25)',
  },
};

export default function CustomAlert(props: CustomAlertProps) {
  const isFromConfig = !!props.config;
  const isVisible = isFromConfig ? (props.config?.visible !== false) : !!props.visible;
  const alertType = (props.config?.type || props.type || 'info') as AlertType;
  const alertTitle = props.config?.title || props.title || 'Notification';
  const alertMessage = props.config?.message || props.message || '';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Derive buttons
  let alertButtons: AlertButton[] = [];
  if (props.config?.buttons && props.config.buttons.length > 0) {
    alertButtons = props.config.buttons;
  } else if (props.buttons && props.buttons.length > 0) {
    alertButtons = props.buttons;
  } else if (props.config?.onConfirm) {
    alertButtons = [
      {
        text: props.config.cancelText || 'Cancel',
        style: 'cancel',
        onPress: () => {
          if (props.config?.onCancel) props.config.onCancel();
          if (props.onClose) props.onClose();
        },
      },
      {
        text: props.config.confirmText || 'Confirm',
        style: alertType === 'warning' || alertType === 'exit' ? 'destructive' : 'primary',
        onPress: () => {
          if (props.config?.onConfirm) props.config.onConfirm();
          if (props.onClose) props.onClose();
        },
      },
    ];
  } else {
    alertButtons = [
      {
        text: props.config?.confirmText || 'OK',
        style: 'primary',
        onPress: () => {
          if (props.onClose) props.onClose();
        },
      },
    ];
  }

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const config = TYPE_CONFIG[alertType] || TYPE_CONFIG.info;
  const IconComponent = config.icon;

  return (
    <Modal transparent visible={isVisible} animationType="none" onRequestClose={props.onClose}>
      <TouchableWithoutFeedback onPress={props.onClose}>
        <View style={styles.backdrop}>
          <Animated.View style={[styles.backdropOverlay, { opacity: fadeAnim }]} />

          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalCard,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                  borderColor: config.border,
                },
              ]}
            >
              {/* Glowing Aura behind icon */}
              <Animated.View
                style={[
                  styles.iconGlow,
                  {
                    backgroundColor: config.glow,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />

              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: config.bg, borderColor: config.border }]}>
                <IconComponent size={28} color={config.color} />
              </View>

              {/* Title & Message */}
              <Text style={styles.title}>{alertTitle}</Text>
              <Text style={styles.message}>{alertMessage}</Text>

              {/* Action Buttons */}
              <View style={[styles.buttonRow, alertButtons.length > 2 && { flexDirection: 'column' }]}>
                {alertButtons.map((btn, idx) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';
                  const isPrimary = btn.style === 'primary' || !btn.style;

                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.85}
                      style={[
                        styles.button,
                        isCancel && styles.buttonCancel,
                        isDestructive && styles.buttonDestructive,
                        isPrimary && styles.buttonPrimary,
                        alertButtons.length === 1 && { flex: 1 },
                      ]}
                      onPress={() => {
                        if (btn.onPress) {
                          btn.onPress();
                        } else if (props.onClose) {
                          props.onClose();
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          isCancel && styles.buttonTextCancel,
                          isDestructive && styles.buttonTextDestructive,
                          isPrimary && styles.buttonTextPrimary,
                        ]}
                      >
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
  },
  modalCard: {
    width: Math.min(width - 48, 380),
    backgroundColor: '#0c101d',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  iconGlow: {
    position: 'absolute',
    top: 24,
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonCancel: {
    backgroundColor: '#172033',
    borderWidth: 1,
    borderColor: '#334155',
  },
  buttonDestructive: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  buttonTextPrimary: {
    color: '#ffffff',
  },
  buttonTextCancel: {
    color: '#cbd5e1',
  },
  buttonTextDestructive: {
    color: '#ffffff',
  },
});
