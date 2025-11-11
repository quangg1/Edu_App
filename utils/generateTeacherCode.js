function generateTeacherCode(fullName, phone) {
    const last4 = phone.slice(-4);

    const namePart = fullName.split(' ').pop().slice(0, 3).toUpperCase();

    return `GV${namePart}${last4}`;
  }
  
  module.exports = generateTeacherCode;