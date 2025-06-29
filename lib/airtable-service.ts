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
  user_id?: string
}

export interface UserRecord {
  Full_Name: string
  Username: string
  Email: string
  Phone: string
  Password: string
  Created_At?: Date
  Status: "active" | "inactive"
  Avatar_URL?: string
  User_ID?: string
  reset_token?: string
  reset_token_expiry?: string // Stored as timestamp string
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
  private usersTableName: string
  private baseUrl: string
  private usersBaseUrl: string

  constructor() {
    this.baseId = process.env.AIRTABLE_BASE_ID || ""
    this.token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || ""
    this.tableName = "CUSTOMERS"
    this.usersTableName = "USERS"
    this.baseUrl = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}`
    this.usersBaseUrl = `https://api.airtable.com/v0/${this.baseId}/${this.usersTableName}`

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

  // User Management Methods
  async createUserRecord(data: Omit<UserRecord, "Status">): Promise<string | null> {
    const userData: UserRecord = {
      ...data,
      Status: "active",
      User_ID: this.generateUserId(),
    }

    // Remove Created_At if it exists - let Airtable handle it automatically
    if (userData.Created_At) {
      delete userData.Created_At
    }

    const response = await fetch(this.usersBaseUrl, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ fields: userData }),
    })

    const result = await this.handleAirtableResponse(response)
    return result.id
  }

  async getUsersByEmail(email: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.usersBaseUrl}?filterByFormula={Email}='${email}'`, {
        headers: this.getHeaders(),
      })

      const data = await this.handleAirtableResponse(response)
      return data.records || []
    } catch (error) {
      console.error("Error fetching user by email:", error)
      return []
    }
  }

  async getUsersByUsername(username: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.usersBaseUrl}?filterByFormula={Username}='${username}'`, {
        headers: this.getHeaders(),
      })

      const data = await this.handleAirtableResponse(response)
      return data.records || []
    } catch (error) {
      console.error("Error fetching user by username:", error)
      return []
    }
  }

  async getUserByEmailOrUsername(identifier: string): Promise<any | null> {
    try {
      // Try email first
      const emailUsers = await this.getUsersByEmail(identifier)
      if (emailUsers.length > 0) {
        return emailUsers[0]
      }

      // Try username
      const usernameUsers = await this.getUsersByUsername(identifier)
      if (usernameUsers.length > 0) {
        return usernameUsers[0]
      }

      return null
    } catch (error) {
      console.error("Error fetching user:", error)
      return null
    }
  }

  async getUsersByResetToken(resetToken: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.usersBaseUrl}?filterByFormula={reset_token}='${resetToken}'`, {
        headers: this.getHeaders(),
      })

      const data = await this.handleAirtableResponse(response)
      return data.records || []
    } catch (error) {
      console.error("Error fetching user by reset token:", error)
      return []
    }
  }

  async updateUserProfile(recordId: string, updates: Partial<UserRecord>): Promise<boolean> {
    try {
      const response = await fetch(`${this.usersBaseUrl}/${recordId}`, {
        method: "PATCH",
        headers: this.getHeaders(),
        body: JSON.stringify({ fields: updates }),
      })

      await this.handleAirtableResponse(response)
      return true
    } catch (error) {
      console.error("Error updating user profile:", error)
      return false
    }
  }

  async getUserOrders(userId: string): Promise<any[]> {
    try {
      console.log(`🔍 Fetching orders for user: ${userId}`);
      
      // Check if user exists in USERS table
      const userResponse = await fetch(`${this.usersBaseUrl}?filterByFormula={User_ID}='${userId}'`, {
        headers: this.getHeaders(),
      });
      const userData = await this.handleAirtableResponse(userResponse);
      console.log(`👤 User lookup result: ${userData.records?.length || 0} users found`);
      
      if (!userData.records || userData.records.length === 0) {
        // User not found, return empty array
        console.log(`❌ User ${userId} not found in USERS table`);
        return [];
      }
      
      // Get user's email and phone to also search by those fields
      const user = userData.records[0];
      const userEmail = user.fields.Email;
      const userPhone = user.fields.Phone;
      
      console.log(`📧 Searching for orders with user_id: ${userId}, email: ${userEmail}, phone: ${userPhone}`);
      
      // Try multiple search strategies
      let allOrders = [];
      
      // Strategy 1: Search by user_id field
      try {
        const response1 = await fetch(`${this.baseUrl}?filterByFormula={user_id}='${userId}'&sort[0][field]=Submitted_At&sort[0][direction]=desc`, {
          headers: this.getHeaders(),
        });
        const data1 = await this.handleAirtableResponse(response1);
        console.log(`📋 Strategy 1 (user_id): Found ${data1.records?.length || 0} orders`);
        if (data1.records) allOrders = allOrders.concat(data1.records);
      } catch (error) {
        console.log(`❌ Strategy 1 failed:`, error);
      }
      
      // Strategy 2: Search by email (if user has email)
      if (userEmail) {
        try {
          const response2 = await fetch(`${this.baseUrl}?filterByFormula={Customer_Name}='${user.fields.Full_Name}'&sort[0][field]=Submitted_At&sort[0][direction]=desc`, {
            headers: this.getHeaders(),
          });
          const data2 = await this.handleAirtableResponse(response2);
          console.log(`📋 Strategy 2 (name match): Found ${data2.records?.length || 0} orders`);
          if (data2.records) allOrders = allOrders.concat(data2.records);
        } catch (error) {
          console.log(`❌ Strategy 2 failed:`, error);
        }
      }
      
      // Strategy 3: Search by phone number (if user has phone)
      if (userPhone) {
        try {
          const response3 = await fetch(`${this.baseUrl}?filterByFormula={Mobile_Number}='${userPhone}'&sort[0][field]=Submitted_At&sort[0][direction]=desc`, {
            headers: this.getHeaders(),
          });
          const data3 = await this.handleAirtableResponse(response3);
          console.log(`📋 Strategy 3 (phone match): Found ${data3.records?.length || 0} orders`);
          if (data3.records) allOrders = allOrders.concat(data3.records);
        } catch (error) {
          console.log(`❌ Strategy 3 failed:`, error);
        }
      }
      
      // Remove duplicates based on record ID
      const uniqueOrders = allOrders.filter((order, index, self) => 
        index === self.findIndex(o => o.id === order.id)
      );
      
      console.log(`📊 Total unique orders found: ${uniqueOrders.length}`);
      
      if (uniqueOrders.length > 0) {
        console.log(`📊 Sample order: ${uniqueOrders[0].fields.Reference_Code} - Status: ${uniqueOrders[0].fields.Status}`);
        console.log(`📊 Order fields:`, Object.keys(uniqueOrders[0].fields));
      }
      
      return uniqueOrders;
    } catch (error) {
      console.error("Error fetching user orders:", error);
      return [];
    }
  }

  private generateUserId(): string {
    return `USER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Existing methods...
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
        Reference_Code: "RATE",
        Submitted_At: new Date().toISOString(),
        Rate: rate,
        Rate_Type: "EXCHANGE_RATE",
        Status: "Completed" as const
      }

      const createResponse = await fetch(this.baseUrl, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ fields: recordData }),
      })

      await this.handleAirtableResponse(createResponse)
      console.log("✅ Created new rate record")
      return true
    } catch (error) {
      console.error("❌ Error setting rate:", error)
      return false
    }
  }
}

export const airtableService = new AirtableService()
