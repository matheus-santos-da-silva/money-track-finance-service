export const SetUTCDates = (date: Date) => {
  let correctDate = date;
  correctDate.setHours(date.getHours() - 3);
  return correctDate;
};
