import { parseAbi } from "viem"

// Updated contract address
export const CONTRACT_ADDRESS = "0x1a3a6b1943dc7bb0ec1bd2b11affef110c211a5c" as const

export const CONTRACT_ABI = parseAbi([
  // Admin functions
  "function admin() external view returns (address)",
  "function addValidator(address validator) external",
  "function addLecturer(address lecturer) external",
  "function addStudents(address[] studentAddresses) external",
  "function assignCourseToLecturer(string courseCode, address lecturer) external",

  // Validator functions
  "function isValidator(address) external view returns (bool)",
  "function validateResults(string session, string semester, string courseCode) external",

  // Lecturer functions
  "function uploadResults(string session, string semester, string courseCode, string ipfsHash, bytes32 merkleRoot) external",

  // View functions
  "function getBatchId(string session, string semester, string courseCode) external pure returns (bytes32)",
  "function batches(bytes32) external view returns (string session, string semester, string courseCode, string ipfsHash, bytes32 merkleRoot, address uploader, bool isFullyValidated)",
  "function isLecturer(address) external view returns (bool)",
  "function isStudent(address) external view returns (bool)",
  "function isLecturerAssigned(address lecturer, string courseCode) external view returns (bool)",
  "function courseToLecturer(string) external view returns (address)",
  "function getAllLecturers() external view returns (address[])",
  "function getAllStudents() external view returns (address[])",
  "function getAllValidators() external view returns (address[])",

  // Array accessors
  "function lecturers(uint256) external view returns (address)",
  "function students(uint256) external view returns (address)",
  "function validators(uint256) external view returns (address)",

  // Constants
  "function MAX_VALIDATORS() external view returns (uint8)",
  "function REQUIRED_VALIDATIONS() external view returns (uint8)",

  // Events
  "event ValidatorAdded(address validator)",
  "event LecturerAdded(address lecturer)",
  "event StudentsAdded(address[] studentAddresses)",
  "event CourseAssigned(string courseCode, address lecturer)",
  "event ResultUploaded(bytes32 indexed batchId, string session, string semester, string courseCode, address indexed uploader, string ipfsHash, bytes32 merkleRoot)",
  "event ResultValidated(bytes32 indexed batchId, address indexed validator)",
])
