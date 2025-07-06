import { describe, it, expect } from 'vitest'
import { parseCookies } from '../src/utils/cookies'

describe('Utils Integration Tests', () => {
  describe('parseCookies', () => {
    it('should parse single cookie correctly', () => {
      const cookies = parseCookies(['sessionId=abc123'])
      
      expect(cookies).toEqual({
        sessionId: 'abc123'
      })
    })

    it('should parse multiple cookies correctly', () => {
      const cookies = parseCookies([
        'sessionId=abc123',
        'userId=user456',
        'theme=dark'
      ])
      
      expect(cookies).toEqual({
        sessionId: 'abc123',
        userId: 'user456',
        theme: 'dark'
      })
    })

    it('should handle empty cookie array', () => {
      const cookies = parseCookies([])
      
      expect(cookies).toEqual({})
    })

    it('should handle undefined cookie array', () => {
      const cookies = parseCookies(undefined)
      
      expect(cookies).toEqual({})
    })

    it('should handle cookies without values', () => {
      const cookies = parseCookies(['sessionId=', 'userId=user456'])
      
      expect(cookies).toEqual({
        sessionId: '',
        userId: 'user456'
      })
    })

    it('should handle cookies with complex values', () => {
      const cookies = parseCookies([
        'oauth_csrf_token=a1b2c3d4e5f6',
        'redirect_url=https://example.com/callback?state=test',
        'user_data={"id":123,"name":"John Doe"}'
      ])
      
      expect(cookies).toEqual({
        oauth_csrf_token: 'a1b2c3d4e5f6',
        redirect_url: 'https://example.com/callback?state=test',
        user_data: '{"id":123,"name":"John Doe"}'
      })
    })

    it('should handle duplicate cookie names with last value taking precedence', () => {
      const cookies = parseCookies([
        'sessionId=first',
        'userId=user456',
        'sessionId=second',
        'sessionId=third'
      ])
      
      expect(cookies).toEqual({
        sessionId: 'third',
        userId: 'user456'
      })
    })

    it('should handle malformed cookies gracefully', () => {
      const cookies = parseCookies([
        'sessionId=abc123',
        'malformed_cookie_without_equals',
        'userId=user456',
        '=value_without_key',
        'theme=dark'
      ])
      
      expect(cookies).toEqual({
        sessionId: 'abc123',
        userId: 'user456',
        '': 'value_without_key',
        theme: 'dark'
      })
    })

    it('should handle cookies with multiple equals signs', () => {
      const cookies = parseCookies([
        'jwt_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        'base64_data=SGVsbG8gV29ybGQ=',
        'url_with_query=https://example.com/test?param1=value1&param2=value2'
      ])
      
      expect(cookies).toEqual({
        jwt_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        base64_data: 'SGVsbG8gV29ybGQ=',
        url_with_query: 'https://example.com/test?param1=value1&param2=value2'
      })
    })

    it('should handle real-world OAuth CSRF token cookie', () => {
      const cookies = parseCookies([
        'oauth_csrf_token=a1b2c3d4e5f6789012345678901234567890abcdef'
      ])
      
      expect(cookies).toEqual({
        oauth_csrf_token: 'a1b2c3d4e5f6789012345678901234567890abcdef'
      })
    })
  })
})