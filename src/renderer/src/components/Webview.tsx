import React, { forwardRef } from 'react';
import { WebviewTag } from 'electron';

interface WebviewProps extends React.ComponentProps<'webview'> {
	// Add any Electron-specific webview props here
	partition?: string;
	preload?: string;
	// ... other Electron webview-specific props
}

const Webview = forwardRef<WebviewTag, WebviewProps>((props, ref) => (
	<webview ref={ref} {...props} />
));
Webview.displayName = 'Webview';

export default Webview;
