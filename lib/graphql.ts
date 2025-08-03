const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/112848/spif/version/latest"

export interface ResultBatch {
  id: string
  batchId: string
  session: string
  semester: string
  courseCode: string
  uploader: string
  uploadDate: string
  merkleRoot: string
  ipfsHash: string
  isValidated: boolean
  studentsCount: number
  validationCount: number
}

export interface StudentResult {
  id: string
  studentAddress: string
  session: string
  semester: string
  courseCode: string
  courseTitle: string
  score: number
  lecturer: string
  validationDate: string
  batchId: string
}

export interface Validator {
  id: string
  address: string
  addedAt: string
}

export interface Lecturer {
  id: string
  address: string
  addedAt: string
}

export interface Student {
  id: string
  address: string
  addedAt: string
}

export interface CourseAssignment {
  id: string
  courseCode: string
  lecturer: string
  assignedAt: string
}

// Helper function to make GraphQL requests with error handling
async function makeGraphQLRequest(query: string, variables?: any): Promise<any> {
  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
    }

    return data.data
  } catch (error) {
    console.error("GraphQL request failed:", error)
    throw error
  }
}

// Test subgraph connection
export async function testSubgraphConnection(): Promise<any> {
  const query = `
    query TestConnection {
      _meta {
        block {
          number
          hash
        }
        deployment
        hasIndexingErrors
      }
    }
  `

  try {
    const data = await makeGraphQLRequest(query)
    console.log("✅ Subgraph connection successful:", data)
    return data
  } catch (error) {
    console.error("❌ Subgraph connection failed:", error)
    throw error
  }
}

export async function fetchValidators(): Promise<string[]> {
  console.log("🔍 Fetching validators from The Graph...")

  const query = `
    query GetValidators {
      validatorAddeds(first: 100, orderBy: blockNumber, orderDirection: desc) {
        id
        validator
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `

  try {
    const data = await makeGraphQLRequest(query)

    if (data.validatorAddeds && Array.isArray(data.validatorAddeds)) {
      console.log("✅ Found validator events:", data.validatorAddeds.length)

      const validators = data.validatorAddeds.map((item: any) => item.validator)
      const uniqueValidators = Array.from(new Set(validators)) as string[]

      console.log(`🎯 Extracted ${uniqueValidators.length} unique validators:`, uniqueValidators)
      return uniqueValidators
    }
  } catch (error) {
    console.error("❌ Error fetching validators:", error)
  }

  console.log("⚠️ No validators found in subgraph")
  return []
}

export async function fetchLecturers(): Promise<Lecturer[]> {
  console.log("🔍 Fetching lecturers from The Graph...")

  const query = `
    query GetLecturers {
      lecturerAddeds(first: 100, orderBy: blockNumber, orderDirection: desc) {
        id
        lecturer
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `

  try {
    const data = await makeGraphQLRequest(query)

    if (data.lecturerAddeds && Array.isArray(data.lecturerAddeds)) {
      console.log(`✅ Found lecturers:`, data.lecturerAddeds.length)

      const lecturers = data.lecturerAddeds.map((item: any) => ({
        id: item.id,
        address: item.lecturer,
        addedAt: new Date(Number.parseInt(item.blockTimestamp) * 1000).toISOString(),
      }))

      console.log(`🎯 Processed ${lecturers.length} lecturers`)
      return lecturers
    }
  } catch (error) {
    console.error("❌ Error fetching lecturers:", error)
  }

  console.log("⚠️ No lecturers found in subgraph")
  return []
}

export async function fetchStudents(): Promise<Student[]> {
  console.log("🔍 Fetching students from The Graph...")

  const query = `
    query GetStudents {
      studentsAddeds(first: 100, orderBy: blockNumber, orderDirection: desc) {
        id
        studentAddresses
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `

  try {
    const data = await makeGraphQLRequest(query)

    if (data.studentsAddeds && Array.isArray(data.studentsAddeds)) {
      console.log(`✅ Found student batch events:`, data.studentsAddeds.length)

      // Flatten all student addresses from all batch events
      const allStudents: Student[] = []

      data.studentsAddeds.forEach((batch: any) => {
        batch.studentAddresses.forEach((address: string, index: number) => {
          allStudents.push({
            id: `${batch.id}_${index}`,
            address: address,
            addedAt: new Date(Number.parseInt(batch.blockTimestamp) * 1000).toISOString(),
          })
        })
      })

      // Remove duplicates based on address
      const uniqueStudents = allStudents.filter(
        (student, index, self) =>
          index === self.findIndex((s) => s.address.toLowerCase() === student.address.toLowerCase()),
      )

      console.log(`🎯 Processed ${uniqueStudents.length} unique students`)
      return uniqueStudents
    }
  } catch (error) {
    console.error("❌ Error fetching students:", error)
  }

  console.log("⚠️ No students found in subgraph")
  return []
}

export async function fetchCourseAssignments(): Promise<CourseAssignment[]> {
  console.log("🔍 Fetching course assignments from The Graph...")

  const query = `
    query GetCourseAssignments {
      courseAssigneds(first: 100, orderBy: blockNumber, orderDirection: desc) {
        id
        courseCode
        lecturer
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `

  try {
    const data = await makeGraphQLRequest(query)

    if (data.courseAssigneds && Array.isArray(data.courseAssigneds)) {
      console.log(`✅ Found course assignments:`, data.courseAssigneds.length)

      const assignments = data.courseAssigneds.map((item: any) => ({
        id: item.id,
        courseCode: item.courseCode,
        lecturer: item.lecturer,
        assignedAt: new Date(Number.parseInt(item.blockTimestamp) * 1000).toISOString(),
      }))

      console.log(`🎯 Processed ${assignments.length} course assignments`)
      return assignments
    }
  } catch (error) {
    console.error("❌ Error fetching course assignments:", error)
  }

  console.log("⚠️ No course assignments found in subgraph")
  return []
}

export async function fetchPendingBatches(): Promise<ResultBatch[]> {
  console.log("🔍 Fetching result batches from The Graph...")

  const query = `
    query GetResultBatches {
      resultUploadeds(first: 100, orderBy: blockNumber, orderDirection: desc) {
        id
        batchId
        session
        semester
        courseCode
        uploader
        ipfsHash
        merkleRoot
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `

  try {
    const data = await makeGraphQLRequest(query)

    if (data.resultUploadeds && Array.isArray(data.resultUploadeds)) {
      console.log("✅ Found uploaded batches:", data.resultUploadeds.length)

      // Get validation counts for each batch
      const validationQuery = `
        query GetValidations {
          resultValidateds(first: 1000) {
            batchId
            validator
          }
        }
      `

      const validationData = await makeGraphQLRequest(validationQuery)
      const validations = validationData.resultValidateds || []

      // Count validations per batch
      const validationCounts: Record<string, number> = {}
      validations.forEach((validation: any) => {
        validationCounts[validation.batchId] = (validationCounts[validation.batchId] || 0) + 1
      })

      // Transform the data to match our interface
      const batches = data.resultUploadeds.map((item: any) => {
        const validationCount = validationCounts[item.batchId] || 0
        const isValidated = validationCount >= 2 // Assuming 2 validations required

        return {
          id: item.id,
          batchId: item.batchId,
          session: item.session,
          semester: item.semester,
          courseCode: item.courseCode,
          uploader: item.uploader,
          uploadDate: new Date(Number.parseInt(item.blockTimestamp) * 1000).toISOString(),
          merkleRoot: item.merkleRoot,
          ipfsHash: item.ipfsHash,
          isValidated,
          studentsCount: 0, // This would need to be calculated from IPFS data
          validationCount,
        }
      })

      // Filter to only show pending (unvalidated) batches
      const pendingBatches = batches.filter((batch: any) => !batch.isValidated)

      console.log(`🎯 Processed ${batches.length} total batches, ${pendingBatches.length} pending validation`)
      return pendingBatches
    }
  } catch (error) {
    console.error("❌ Error fetching batches:", error)
  }

  console.log("⚠️ No batches found in subgraph")
  return []
}

export async function fetchStudentResults(studentAddress: string): Promise<StudentResult[]> {
  console.log("🔍 Fetching student results from The Graph for:", studentAddress)

  // First get all validated batches
  const validatedBatchesQuery = `
    query GetValidatedBatches {
      resultValidateds(first: 1000) {
        batchId
        validator
        blockNumber
        blockTimestamp
      }
    }
  `

  try {
    const validationData = await makeGraphQLRequest(validatedBatchesQuery)

    if (!validationData.resultValidateds) {
      console.log("⚠️ No validated results found")
      return []
    }

    // Group validations by batchId and count them
    const validationCounts: Record<string, { count: number; latestTimestamp: string }> = {}
    validationData.resultValidateds.forEach((validation: any) => {
      if (!validationCounts[validation.batchId]) {
        validationCounts[validation.batchId] = { count: 0, latestTimestamp: validation.blockTimestamp }
      }
      validationCounts[validation.batchId].count++
      if (validation.blockTimestamp > validationCounts[validation.batchId].latestTimestamp) {
        validationCounts[validation.batchId].latestTimestamp = validation.blockTimestamp
      }
    })

    // Get fully validated batches (assuming 2 validations required)
    const fullyValidatedBatchIds = Object.keys(validationCounts).filter(
      (batchId) => validationCounts[batchId].count >= 2,
    )

    if (fullyValidatedBatchIds.length === 0) {
      console.log("⚠️ No fully validated batches found")
      return []
    }

    // Get the upload details for validated batches
    const batchDetailsQuery = `
      query GetBatchDetails($batchIds: [String!]!) {
        resultUploadeds(where: { batchId_in: $batchIds }) {
          id
          batchId
          session
          semester
          courseCode
          uploader
          ipfsHash
          blockTimestamp
        }
      }
    `

    const batchData = await makeGraphQLRequest(batchDetailsQuery, {
      batchIds: fullyValidatedBatchIds,
    })

    if (!batchData.resultUploadeds) {
      console.log("⚠️ No batch details found")
      return []
    }

    console.log(`✅ Found ${batchData.resultUploadeds.length} validated batches`)

    // For now, return mock student results since we need to fetch from IPFS
    // In a real implementation, you would fetch the IPFS data and filter by student address
    const mockResults = batchData.resultUploadeds.map((batch: any, index: number) => ({
      id: `result_${batch.batchId}_${studentAddress}`,
      studentAddress: studentAddress.toLowerCase(),
      session: batch.session,
      semester: batch.semester,
      courseCode: batch.courseCode,
      courseTitle: `Course ${batch.courseCode}`,
      score: 75 + ((index * 5) % 25), // Mock score
      lecturer: "Dr. Smith",
      validationDate: new Date(Number.parseInt(validationCounts[batch.batchId].latestTimestamp) * 1000).toISOString(),
      batchId: batch.batchId,
    }))

    console.log(`🎯 Generated ${mockResults.length} student results`)
    return mockResults
  } catch (error) {
    console.error("❌ Error fetching student results:", error)
    return []
  }
}

export async function fetchLecturerUploads(lecturerAddress: string): Promise<ResultBatch[]> {
  console.log("🔍 Fetching lecturer uploads from The Graph for:", lecturerAddress)

  const query = `
    query GetLecturerUploads($uploader: String!) {
      resultUploadeds(
        where: { uploader: $uploader }
        orderBy: blockNumber
        orderDirection: desc
      ) {
        id
        batchId
        session
        semester
        courseCode
        uploader
        ipfsHash
        merkleRoot
        blockNumber
        blockTimestamp
        transactionHash
      }
    }
  `

  try {
    const data = await makeGraphQLRequest(query, {
      uploader: lecturerAddress.toLowerCase(),
    })

    if (data.resultUploadeds && Array.isArray(data.resultUploadeds)) {
      console.log(`✅ Found ${data.resultUploadeds.length} uploads for lecturer`)

      // Get validation counts for each batch
      const validationQuery = `
        query GetValidations {
          resultValidateds(first: 1000) {
            batchId
            validator
          }
        }
      `

      const validationData = await makeGraphQLRequest(validationQuery)
      const validations = validationData.resultValidateds || []

      // Count validations per batch
      const validationCounts: Record<string, number> = {}
      validations.forEach((validation: any) => {
        validationCounts[validation.batchId] = (validationCounts[validation.batchId] || 0) + 1
      })

      // Transform the data
      const batches = data.resultUploadeds.map((item: any) => {
        const validationCount = validationCounts[item.batchId] || 0
        const isValidated = validationCount >= 2 // Assuming 2 validations required

        return {
          id: item.id,
          batchId: item.batchId,
          session: item.session,
          semester: item.semester,
          courseCode: item.courseCode,
          uploader: item.uploader,
          uploadDate: new Date(Number.parseInt(item.blockTimestamp) * 1000).toISOString(),
          merkleRoot: item.merkleRoot,
          ipfsHash: item.ipfsHash,
          isValidated,
          studentsCount: 0, // Would need IPFS data
          validationCount,
        }
      })

      console.log(`🎯 Processed ${batches.length} uploads for lecturer`)
      return batches
    }
  } catch (error) {
    console.error("❌ Error fetching lecturer uploads:", error)
  }

  return []
}

// Helper function to explore the subgraph schema
export async function exploreSubgraphSchema(): Promise<void> {
  const query = `
    query ExploreSchema {
      resultUploadeds(first: 1) {
        id
        batchId
        session
        semester
        courseCode
        uploader
        ipfsHash
        merkleRoot
        blockNumber
        blockTimestamp
        transactionHash
      }
      resultValidateds(first: 1) {
        id
        batchId
        validator
        blockNumber
        blockTimestamp
        transactionHash
      }
      lecturerAddeds(first: 1) {
        id
        lecturer
        blockNumber
        blockTimestamp
      }
      studentsAddeds(first: 1) {
        id
        studentAddresses
        blockNumber
        blockTimestamp
      }
      courseAssigneds(first: 1) {
        id
        courseCode
        lecturer
        blockNumber
        blockTimestamp
      }
    }
  `

  try {
    const data = await makeGraphQLRequest(query)
    console.log("🔍 Schema exploration successful:")
    console.log("📊 Sample resultUploadeds:", data.resultUploadeds)
    console.log("📊 Sample resultValidateds:", data.resultValidateds)
    console.log("📊 Sample lecturerAddeds:", data.lecturerAddeds)
    console.log("📊 Sample studentsAddeds:", data.studentsAddeds)
    console.log("📊 Sample courseAssigneds:", data.courseAssigneds)
  } catch (error) {
    console.error("❌ Schema exploration failed:", error)
  }
}

// Initialize subgraph connection
export async function initializeSubgraph(): Promise<void> {
  try {
    console.log("🚀 Initializing subgraph connection...")
    await testSubgraphConnection()
    await exploreSubgraphSchema()
    console.log("✅ Subgraph initialization complete")
  } catch (error) {
    console.error("❌ Subgraph initialization failed:", error)
  }
}
