import { notify } from '../utils/notifications';

export const notifyDisconnected = () => {
    const message = 'No blockchain routes found!';
    console.error(message);
    notify({
        message: 'Connection',
        description: message,
        type: 'error',
    });
};
