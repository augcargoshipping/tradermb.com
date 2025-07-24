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
  QR_Code?: { url: string }[]
  user_id?: string
}

export interface RateRecord {
  type: "standard" | "low rmb"
  value: number
  "Created By"?: {
    id: string
    email: string
    name: string
  }
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
  private ratesTableName: string
  private baseUrl: string
  private usersBaseUrl: string
  private ratesBaseUrl: string

  constructor() {
    this.baseId = process.env.AIRTABLE_BASE_ID || ""
    this.token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || ""
    this.tableName = "CUSTOMERS"
    this.usersTableName = "USERS"
    this.ratesTableName = "RATES"
    this.baseUrl = `https://api.airtable.com/v0/${this.baseId}/${this.tableName}`
    this.usersBaseUrl = `https://api.airtable.com/v0/${this.baseId}/${this.usersTableName}`
    this.ratesBaseUrl = `https://api.airtable.com/v0/${this.baseId}/${this.ratesTableName}`

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
    try {
      const response = await fetch(`${this.baseUrl}?maxRecords=1`, {
        headers: this.getHeaders(),
      })
      return response.ok
    } catch (error) {
      console.error("❌ Connection test failed:", error)
      return false
    }
  }

  async fetchAllRates(): Promise<{ standard: number | null; lowRmb: number | null }> {
    try {
      console.log("🔍 Fetching all rates from RATES table...")
      console.log(`📋 RATES table URL: ${this.ratesBaseUrl}`)
      
      const response = await fetch(this.ratesBaseUrl, {
        headers: this.getHeaders(),
      })

      console.log(`📊 RATES table response status: ${response.status}`)
      
      if (!response.ok) {
        console.error(`❌ RATES table request failed: ${response.status} ${response.statusText}`)
        const errorText = await response.text()
        console.error(`❌ Error details: ${errorText}`)
        return { standard: null, lowRmb: null }
      }

      const data = await this.handleAirtableResponse(response)
      console.log(`📊 RATES table data:`, data)
      
      let standardRate: number | null = null
      let lowRmbRate: number | null = null

      if (data.records && data.records.length > 0) {
        console.log(`📋 Found ${data.records.length} records in RATES table`)
        
        for (const record of data.records) {
          console.log(`📋 Record fields:`, record.fields)
          const fields = record.fields as RateRecord
          
          if (fields.type === "standard" && typeof fields.value === "number") {
            standardRate = fields.value
            console.log(`✅ Found standard rate: ${standardRate}`)
          } else if (fields.type === "low rmb" && typeof fields.value === "number") {
            lowRmbRate = fields.value
            console.log(`✅ Found low RMB rate: ${lowRmbRate}`)
          } else {
            console.log(`⚠️ Record has unexpected fields:`, fields)
          }
        }
      } else {
        console.log("⚠️ No records found in RATES table")
      }

      console.log(`📊 Final rates: standard=${standardRate}, lowRmb=${lowRmbRate}`)
      return { standard: standardRate, lowRmb: lowRmbRate }
    } catch (error) {
      console.error("❌ Error fetching rates:", error)
      return { standard: null, lowRmb: null }
    }
  }

  async getRateForAmount(rmbAmount: number): Promise<{ rate: number | null; type: "standard" | "low rmb" | null }> {
    try {
      const rates = await this.fetchAllRates()
      
      if (rmbAmount >= 1000) {
        if (rates.standard !== null) {
          console.log(`✅ Using standard rate (${rates.standard}) for amount ¥${rmbAmount}`)
          return { rate: rates.standard, type: "standard" }
        }
      } else {
        if (rates.lowRmb !== null) {
          console.log(`✅ Using low RMB rate (${rates.lowRmb}) for amount ¥${rmbAmount}`)
          return { rate: rates.lowRmb, type: "low rmb" }
        }
      }

      // Fallback to standard rate if low RMB rate is not available
      if (rates.standard !== null) {
        console.log(`⚠️ Using standard rate (${rates.standard}) as fallback for amount ¥${rmbAmount}`)
        return { rate: rates.standard, type: "standard" }
      }

      console.log("❌ No valid rates found")
      return { rate: null, type: null }
    } catch (error) {
      console.error("❌ Error getting rate for amount:", error)
      return { rate: null, type: null }
    }
  }
}

export const airtableService = new AirtableService()
