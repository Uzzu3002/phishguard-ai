// Definitions for different threat risk levels
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

export const RISK_CONFIG = {
  [RISK_LEVELS.LOW]: {
    label: 'Safe',
    color: 'success',
  },
  [RISK_LEVELS.MEDIUM]: {
    label: 'Suspicious',
    color: 'warning',
  },
  [RISK_LEVELS.HIGH]: {
    label: 'Malicious',
    color: 'danger',
  }
};
