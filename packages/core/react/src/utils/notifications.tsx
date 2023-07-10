import type { ReactNode } from 'react';
import React from 'react';
import { notification } from 'antd';
import 'react-toastify/dist/ReactToastify.min.css';

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

export type NotificationType = 'success' | 'info' | 'warning' | 'error' | undefined;

export const notify = ({ type = 'info', message, description, ...props }: NotificationArgsProps) => {
    if (type && ['info', 'otherTypes'].includes(type)) {
        notification[type]({
            message: <span>{message as ReactNode}</span>,
            description: <span>{description as ReactNode}</span>,
            ...props,
        });
    } else {
        console.error('Invalid type for notification');
    }
};
