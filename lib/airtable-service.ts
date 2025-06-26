// Airtable integration service for RMB TRANSACTIONS base

export interface CustomerRecord {
  Customer_Name: string
  Mobile_Number: string
  Referral_Name?: string
  GHS_Amount: number
  RMB_Amount: number
  Reference_Code: string
  Status: "Pending" | "Paid" | "Completed" | "Cancelled"
  Submitted_At: string
  Rate?: number
  Rate_Type?: string
  QR_Code?: { url: string }[]
}

export interface AirtableResponse {
  id: string
  fields: CustomerRecord
  createdTime: string
}

export interface AirtableError {
  error: {
    type: string
    message: string
  }
}

export class AirtableService {
  private baseId: string
  private token: string
  private tableName: string
  private baseUrl: string

  constructor() {
    this.baseId = process.env.AIRTABLE_BASE_ID || ""
    this.token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || ""
    this.tableName = "CUSTOMERS"
    this.baseUrl = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}`

    if (!this.baseId || !this.token) {
      console.warn("⚠️ Airtable credentials not configured")
    }
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    }
  }

  private async handleAirtableResponse(response: Response): Promise<any> {
    const text = await response.text()
    const contentType = response.headers.get("content-type")

    if (!contentType || !contentType.includes("application/json")) {
      console.error("Airtable returned non-JSON response:", text)
      throw new Error(`Airtable returned non-JSON response: ${text}`)
    }

    const data = JSON.parse(text)

    if (!response.ok) {
      console.error("Airtable API error details:", data) 
      throw new Error(`Airtable API error (${response.status}): ${data.error?.message || response.statusText}`)
    }

    return data
  }

  async createRecord(data: Omit<CustomerRecord, "Status">): Promise<string | null> {
    const recordData: CustomerRecord = {
      ...data,
      Status: "Pending",
    }

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ fields: recordData }),
    })

    const result = await this.handleAirtableResponse(response)
    return result.id
  }

  async updateRecordStatus(recordId: string, status: CustomerRecord["Status"]): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/${recordId}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify({
        fields: { Status: status },
      }),
    })

    await this.handleAirtableResponse(response)
    return true
  }

  generateReferenceCode(fullName: string): string {
    // Extract initials from full name
    const nameParts = fullName.trim().split(/\s+/)
    const initials = nameParts
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 5) // Limit to 5 initials max to keep it reasonable
    
    // Generate 3 random digits
    const randomDigits = Math.floor(100 + Math.random() * 900).toString()
    
    return `${initials}${randomDigits}`
  }

  async testConnection(): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}?maxRecords=1`, {
      headers: this.getHeaders(),
    })
    return response.ok
  }

  async fetchCurrentRate(): Promise<number | null> {
    try {
      console.log("🔍 Fetching rate from Airtable...")
      
      // First, try to get rate from a dedicated rate record
      const rateResponse = await fetch(`${this.baseUrl}?filterByFormula={Rate_Type}='EXCHANGE_RATE'&maxRecords=1`, {
        headers: this.getHeaders(),
      })

      if (rateResponse.ok) {
        const rateData = await this.handleAirtableResponse(rateResponse)
        if (rateData.records && rateData.records.length > 0) {
          const rateRecord = rateData.records[0] as AirtableResponse
          if (rateRecord.fields.Rate && typeof rateRecord.fields.Rate === "number" && rateRecord.fields.Rate > 0) {
            console.log(`✅ Found dedicated rate: ${rateRecord.fields.Rate}`)
            return rateRecord.fields.Rate
          }
        }
      }

      // Fallback: look for rate in recent customer records
      const response = await fetch(`${this.baseUrl}?maxRecords=10&sort[0][field]=Submitted_At&sort[0][direction]=desc`, {
        headers: this.getHeaders(),
      })

      const data = await this.handleAirtableResponse(response)

      if (data.records && data.records.length > 0) {
        // Look for a record with a Rate field
        for (const record of data.records) {
          const fields = record.fields as CustomerRecord
          if (fields.Rate !== undefined && typeof fields.Rate === "number" && fields.Rate > 0) {
            console.log(`✅ Found rate: ${fields.Rate} from record ${record.id}`)
            return fields.Rate
          }
        }
        
        console.log("⚠️ No records with valid Rate field found")
        console.log("Available fields in first record:", Object.keys(data.records[0].fields))
      } else {
        console.log("⚠️ No records found in CUSTOMERS table")
      }

      return null
    } catch (error) {
      console.error("❌ Error fetching rate:", error)
      return null
    }
  }

  async setExchangeRate(rate: number): Promise<boolean> {
    try {
      console.log(`🔧 Setting exchange rate to: ${rate}`)
      
      // First, try to update existing rate record
      const rateResponse = await fetch(`${this.baseUrl}?filterByFormula={Rate_Type}='EXCHANGE_RATE'&maxRecords=1`, {
        headers: this.getHeaders(),
      })

      if (rateResponse.ok) {
        const rateData = await this.handleAirtableResponse(rateResponse)
        if (rateData.records && rateData.records.length > 0) {
          const recordId = rateData.records[0].id
          const updateResponse = await fetch(`${this.baseUrl}/${recordId}`, {
            method: "PATCH",
            headers: this.getHeaders(),
            body: JSON.stringify({
              fields: { Rate: rate }
            }),
          })
          await this.handleAirtableResponse(updateResponse)
          console.log("✅ Updated existing rate record")
          return true
        }
      }

      // Create new rate record if none exists
      const recordData = {
        Customer_Name: "SYSTEM_RATE",
        Mobile_Number: "0000000000",
        GHS_Amount: 0,
        RMB_Amount: 0,
        Reference_Code: "RATE-" + Date.now(),
        Status: "Completed" as const,
        Submitted_At: new Date().toISOString(),
        Rate: rate,
        Rate_Type: "EXCHANGE_RATE"
      }

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ fields: recordData }),
      })

      await this.handleAirtableResponse(response)
      console.log("✅ Created new rate record")
      return true
    } catch (error) {
      console.error("❌ Error setting rate:", error)
      return false
    }
  }
}

export const airtableService = new AirtableService()
