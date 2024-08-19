// Define the options for the notification
interface NotificationOptions {
	position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left' | 'center';
	duration?: number;
	isHidePrev?: boolean;
	isHideTitle?: boolean;
	maxOpened?: number;
}

// Define the parameters for the showPopup method
interface ShowPopupParams {
	type: 'dialog' | 'info' | 'success' | 'warning' | 'error';
	title?: string;
	message?: string;
	callback?: (result: 'ok' | 'cancel') => void;
	validFunc?: () => boolean;
}

// Define the methods available in the Notification function
interface Notification {
	dialog(options: {
		title?: string;
		message?: string;
		callback?: (result: 'ok' | 'cancel') => void;
		validFunc?: () => boolean;
	}): void;
	info(options: { title?: string; message?: string }): void;
	success(options: { title?: string; message?: string }): void;
	warning(options: { title?: string; message?: string }): void;
	error(options: { title?: string; message?: string }): void;
	setProperty(options: NotificationOptions): void;
	hide(): void;
}

// Export the Notification function as the default export
declare function Notification(options?: NotificationOptions): Notification;

export default Notification;
