export default class ToggleHelper {
  toggle(value) {
    // Flip any boolean or alternate string value
    if (typeof value === 'boolean') {
        console.log('Toggle called for a boolean');
      return !value;
    }

    if (typeof value === 'string') {
        console.log('Toggle called for a string');
      return value === 'panel-expanded' ? 'panel-collapsed' : 'panel-expanded';
    }

    return value; // default: return unchanged
  }
}