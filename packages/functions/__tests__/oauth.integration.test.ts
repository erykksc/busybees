import { describe, it, expect, beforeAll } from 'vitest'
import { Resource } from 'sst'
import { getTestJwtToken, TEST_USER } from './setup'

describe('OAuth Integration Tests', () => {
  let jwtToken: string
  
  beforeAll(async () => {
    jwtToken = await getTestJwtToken()
  })

  describe('GET /api/oauth/google/start', () => {
    it('should return redirect URL when authenticated', async () => {
      const response = await fetch(`${Resource.MyApi.url}/api/oauth/google/start`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Referer': 'https://example.com/calendar',
        },
      })

      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('redirectUrl')
      expect(data.redirectUrl).toContain('accounts.google.com')
      expect(data.redirectUrl).toContain('oauth2')
      
      // Check that CSRF cookie is set
      const cookies = response.headers.get('set-cookie')
      expect(cookies).toContain('oauth_csrf_token=')
      expect(cookies).toContain('HttpOnly')
      expect(cookies).toContain('Secure')
    })

    it('should return 401 when not authenticated', async () => {
      const response = await fetch(`${Resource.MyApi.url}/api/oauth/google/start`, {
        method: 'GET',
        headers: {
          'Referer': 'https://example.com/calendar',
        },
      })

      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data.error).toBe('User not authenticated')
    })

    it('should return 401 when referer header is missing', async () => {
      const response = await fetch(`${Resource.MyApi.url}/api/oauth/google/start`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
        },
      })

      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data.error).toBe('Referer not specified in headers')
    })
  })

  describe('GET /api/oauth/google/callback', () => {
    it('should return 400 when authorization code is missing', async () => {
      const response = await fetch(`${Resource.MyApi.url}/api/oauth/google/callback`, {
        method: 'GET',
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('Authorization code is required')
    })

    it('should return 400 when scope is missing', async () => {
      const response = await fetch(`${Resource.MyApi.url}/api/oauth/google/callback?code=test_code`, {
        method: 'GET',
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('scope` is required')
    })

    it('should return 400 when state is missing', async () => {
      const response = await fetch(`${Resource.MyApi.url}/api/oauth/google/callback?code=test_code&scope=test_scope`, {
        method: 'GET',
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('state` is required')
    })

    it('should return 400 when state is invalid', async () => {
      const response = await fetch(`${Resource.MyApi.url}/api/oauth/google/callback?code=test_code&scope=calendar&state=invalid_state`, {
        method: 'GET',
      })

      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain('Invalid OAuth state')
    })

    // Note: Testing successful OAuth flow requires valid Google OAuth tokens
    // which is complex to mock in integration tests. In a real scenario,
    // you'd need to either:
    // 1. Use Google's OAuth testing tools
    // 2. Mock the Google OAuth endpoints
    // 3. Use a staging environment with test OAuth credentials
  })
})