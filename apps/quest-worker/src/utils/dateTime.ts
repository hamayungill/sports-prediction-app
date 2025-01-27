const addMinutes = (minutesToAdd: number): Date => {
  return new Date(new Date().getTime() + Number(minutesToAdd) * 60000)
}

const getTimeStamp = (date: string): number => {
  return new Date(date).getTime()
}

export { addMinutes, getTimeStamp }
