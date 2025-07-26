export default class DemoPlugin {
  async init(settings, context) {
    this.settings = settings;
    this.context = context;
  }

  async onLocationChange(newLocation, _state) {
    if (this.settings.loggingEnabled) {
      console.log(`Location changed to ${newLocation.name}`);
    }
  }
}
