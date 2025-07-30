import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ExpoSmsManager.types';

type ExpoSmsManagerModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ExpoSmsManagerModule extends NativeModule<ExpoSmsManagerModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ExpoSmsManagerModule, 'ExpoSmsManagerModule');
