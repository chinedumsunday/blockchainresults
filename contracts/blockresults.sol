// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ExamResults {
    address public admin;
    uint8 public constant REQUIRED_VALIDATIONS = 3;
    uint8 public constant MAX_VALIDATORS = 3;

    struct ResultBatch {
        string session;
        string semester;
        string courseCode;
        string ipfsHash;
        bytes32 merkleRoot;
        address uploader;
        address[] validators;
        bool isFullyValidated;
    }

    mapping(bytes32 => ResultBatch) public batches;
    mapping(address => bool) public isValidator;
    mapping(address => bool) public isLecturer;
    mapping(address => bool) public isStudent;
    mapping(string => address) public courseToLecturer;

    address[] public validators;
    address[] public lecturers;
    address[] public students;

    event ResultUploaded(
        bytes32 indexed batchId,
        string session,
        string semester,
        string courseCode,
        address indexed uploader,
        string ipfsHash,
        bytes32 merkleRoot
    );

    event ResultValidated(
        bytes32 indexed batchId,
        address indexed validator
    );

    event ValidatorAdded(address validator);
    event LecturerAdded(address lecturer);
    event CourseAssigned(string courseCode, address lecturer);
    event StudentsAdded(address[] studentAddresses);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyValidator() {
        require(isValidator[msg.sender], "Not a validator");
        _;
    }

    modifier onlyLecturer() {
        require(isLecturer[msg.sender], "Only lecturer can perform this action");
        _;
    }

    function addValidator(address validator) external onlyAdmin {
        require(!isValidator[validator], "Already a validator");
        require(validators.length < MAX_VALIDATORS, "Max validators reached");

        isValidator[validator] = true;
        validators.push(validator);

        emit ValidatorAdded(validator);
    }

    function addLecturer(address lecturer) external onlyAdmin {
        require(!isLecturer[lecturer], "Already a lecturer");

        isLecturer[lecturer] = true;
        lecturers.push(lecturer);

        emit LecturerAdded(lecturer);
    }

    function assignCourseToLecturer(string calldata courseCode, address lecturer) external onlyAdmin {
        require(isLecturer[lecturer], "Not a registered lecturer");

        courseToLecturer[courseCode] = lecturer;

        emit CourseAssigned(courseCode, lecturer);
    }

    function addStudents(address[] calldata studentAddresses) external onlyAdmin {
        for (uint256 i = 0; i < studentAddresses.length; i++) {
            address student = studentAddresses[i];
            if (!isStudent[student]) {
                isStudent[student] = true;
                students.push(student);
            }
        }

        emit StudentsAdded(studentAddresses);
    }

    function uploadResults(
        string calldata session,
        string calldata semester,
        string calldata courseCode,
        string calldata ipfsHash,
        bytes32 merkleRoot
    ) external onlyLecturer {
        require(courseToLecturer[courseCode] == msg.sender, "You are not assigned to this course");

        bytes32 batchId = getBatchId(session, semester, courseCode);
        require(batches[batchId].uploader == address(0), "Batch already uploaded");

        batches[batchId] = ResultBatch({
            session: session,
            semester: semester,
            courseCode: courseCode,
            ipfsHash: ipfsHash,
            merkleRoot: merkleRoot,
            uploader: msg.sender,
            validators: new address[](0) ,
            isFullyValidated: false
        });

        emit ResultUploaded(
            batchId,
            session,
            semester,
            courseCode,
            msg.sender,
            ipfsHash,
            merkleRoot
        );
    }

    function validateResults(
        string calldata session,
        string calldata semester,
        string calldata courseCode
    ) external onlyValidator {
        bytes32 batchId = getBatchId(session, semester, courseCode);
        ResultBatch storage batch = batches[batchId];
        require(batch.uploader != address(0), "Batch does not exist");
        require(!batch.isFullyValidated, "Already validated");

        for (uint256 i = 0; i < batch.validators.length; i++) {
            require(batch.validators[i] != msg.sender, "Already validated");
        }

        batch.validators.push(msg.sender);

        if (batch.validators.length >= REQUIRED_VALIDATIONS) {
            batch.isFullyValidated = true;
        }

        emit ResultValidated(batchId, msg.sender);
    }

    function getBatchId(
        string memory session,
        string memory semester,
        string memory courseCode
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(session, semester, courseCode));
    }

    function getAllValidators() external view returns (address[] memory) {
        return validators;
    }

    function getAllLecturers() external view returns (address[] memory) {
        return lecturers;
    }

    function getAllStudents() external view returns (address[] memory) {
        return students;
    }

    function isLecturerAssigned(address lecturer, string calldata courseCode) external view returns (bool) {
        return courseToLecturer[courseCode] == lecturer;
    }
}

