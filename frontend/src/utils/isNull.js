export default function isNull (object) {
  // Checks if all values in object are null
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      if (object[key] !== null) {
        return false;
      }
    }
  }
  return true;
}