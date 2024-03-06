import type { ReactNode } from 'react';
import React from 'react';
import { notification } from 'antd';

interface NotificationArgsProps {
    type?: NotificationType;
    message?: ReactNode;
    description?: ReactNode;
    duration?: number;
    placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
    onclose?: () => void;
    icon?: ReactNode;
    key?: string;
    btn?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

const NotificationTypes = [
    'success',
    'info',
    'warning',
    'error',
  ] as const;
  
export type NotificationType = typeof NotificationTypes[number] | undefined;

export const notify = ({ type = 'info', message, description, ...props }: NotificationArgsProps) => {
    if (type && NotificationTypes.includes(type)) {
        notification[type]({
            message: <span>{message as ReactNode}</span>,
            description: <span>{description as ReactNode}</span>,
            ...props,
        });
    } else {
        console.error('Invalid type for notification');
    }
};
