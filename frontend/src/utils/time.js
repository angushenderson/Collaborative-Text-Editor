export default function TimeOfDayWelcomeMessage() {
  // Generate a welcome message based on the current time of day
  
  const hrs = new Date().getHours();

  if (hrs > 4 && hrs < 12)
    return 'Good Morning';
  else if (hrs >= 12 && hrs <= 18)
    return 'Good Afternoon';
  else if (hrs >= 18 && hrs <= 23)
    return 'Good Evening';
  else
    return 'Good Night';
}
