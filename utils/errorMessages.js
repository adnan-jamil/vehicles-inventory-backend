//  To sow validation messages
const errorFormatter = (e) => {
    let errors = {};
    const allErrors = e.substring(e.indexOf(":") + 1).trim();
    const firstError = allErrors.split(",")[0].trim();

    if (firstError) {
        const [key, value] = firstError.split(":").map((err) => err.trim());
        return errors = value;
    } else {
        return {}; // Return an empty object if there are no errors
    }
  };

module.exports = errorFormatter;