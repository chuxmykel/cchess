// Mirrors cchess-be's RegisterDto, so a name is only checked for
// availability once the server would accept it.
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
