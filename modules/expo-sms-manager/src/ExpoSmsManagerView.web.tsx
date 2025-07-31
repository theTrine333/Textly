import * as React from 'react';

import { ExpoSmsManagerViewProps } from './ExpoSmsManager.types';

export default function ExpoSmsManagerView(props: ExpoSmsManagerViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
