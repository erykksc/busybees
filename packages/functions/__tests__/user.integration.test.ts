import { describe, it, expect, beforeAll } from 'vitest'
import { Resource } from 'sst'
import { getTestJwtToken, TEST_USER } from './setup'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

describe('User Functions Integration Tests', () => {
  let jwtToken: string
  
  beforeAll(async () => {
    jwtToken = await getTestJwtToken()
  })

  describe('GET /api/user/calendars', () => {
    it('should return empty array when user has no calendars', async () => {
      // Ensure user has no calendar connections
      await docClient.send(new DeleteCommand({
        TableName: Resource.UsersTable.name,
        Key: { userId: TEST_USER.authSub },
      }))

      const response = await fetch(`${Resource.MyApi.url}/api/user/calendars`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
        },
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('googleCalendars')
      expect(data.googleCalendars).toEqual([])
    })

    it('should return calendar connections when user has them', async () => {
      // Create a test user with calendar connections
      const testUser = {
        userId: TEST_USER.authSub,
        googleCalendars: [
          {
            email: 'test@example.com',
            calendarId: 'primary',
            scope: 'https://www.googleapis.com/auth/calendar.readonly',
            provider: 'google',
            expiryDate: new Date(Date.now() + 3600000).toISOString(),
            tokenType: 'Bearer',
            tokens: {
              access_token: 'test_access_token',
              refresh_token: 'test_refresh_token',
            },
          },
        ],
      }

      await docClient.send(new PutCommand({
        TableName: Resource.UsersTable.name,
        Item: testUser,
      }))

      const response = await fetch(`${Resource.MyApi.url}/api/user/calendars`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
        },
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('googleCalendars')
      expect(data.googleCalendars).toHaveLength(1)
      
      const calendar = data.googleCalendars[0]
      expect(calendar).toHaveProperty('calendarId', 'primary')
      expect(calendar).toHaveProperty('scope')
      expect(calendar).toHaveProperty('provider', 'google')
      expect(calendar).toHaveProperty('expiryDate')
      expect(calendar).toHaveProperty('tokenType', 'Bearer')
      
      // Ensure sensitive tokens are not exposed
      expect(calendar).not.toHaveProperty('tokens')
      expect(calendar).not.toHaveProperty('access_token')
      expect(calendar).not.toHaveProperty('refresh_token')
    })

    it('should return 401 when not authenticated', async () => {
      const response = await fetch(`${Resource.MyApi.url}/api/user/calendars`, {
        method: 'GET',
      })

      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data.error).toBe('User not authenticated')
    })

    it('should handle multiple calendar connections', async () => {
      // Create a test user with multiple calendar connections
      const testUser = {
        userId: TEST_USER.authSub,
        googleCalendars: [
          {
            email: 'test1@example.com',
            calendarId: 'primary',
            scope: 'https://www.googleapis.com/auth/calendar.readonly',
            provider: 'google',
            expiryDate: new Date(Date.now() + 3600000).toISOString(),
            tokenType: 'Bearer',
            tokens: {
              access_token: 'test_access_token_1',
              refresh_token: 'test_refresh_token_1',
            },
          },
          {
            email: 'test2@example.com',
            calendarId: 'secondary',
            scope: 'https://www.googleapis.com/auth/calendar.readonly',
            provider: 'google',
            expiryDate: new Date(Date.now() + 3600000).toISOString(),
            tokenType: 'Bearer',
            tokens: {
              access_token: 'test_access_token_2',
              refresh_token: 'test_refresh_token_2',
            },
          },
        ],
      }

      await docClient.send(new PutCommand({
        TableName: Resource.UsersTable.name,
        Item: testUser,
      }))

      const response = await fetch(`${Resource.MyApi.url}/api/user/calendars`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
        },
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('googleCalendars')
      expect(data.googleCalendars).toHaveLength(2)
      
      // Verify both calendars are returned without sensitive data
      data.googleCalendars.forEach((calendar: any) => {
        expect(calendar).toHaveProperty('calendarId')
        expect(calendar).toHaveProperty('scope')
        expect(calendar).toHaveProperty('provider', 'google')
        expect(calendar).toHaveProperty('expiryDate')
        expect(calendar).toHaveProperty('tokenType', 'Bearer')
        
        // Ensure sensitive tokens are not exposed
        expect(calendar).not.toHaveProperty('tokens')
        expect(calendar).not.toHaveProperty('access_token')
        expect(calendar).not.toHaveProperty('refresh_token')
      })
    })
  })
})