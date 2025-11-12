Add 422-aware error detail capture and display (status, field errors, full server payload) to UserProfile; preserve existing logic and styling

```jsx
import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Edit2, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../../contexts/AuthContext';

function extractApiErrorMessage(error, fallback) {
  if (!error) return fallback;

  const body = error.body;

  // Prefer specific messages from server when available
  if (body) {
    if (typeof body === 'string') {
      return body;
    }
    if (typeof body === 'object') {
      if (body.detail && typeof body.detail === 'string') {
        return body.detail;
      }
      if (body.error && typeof body.error === 'string') {
        return body.error;
      }
      if (body.message && typeof body.message === 'string') {
        return body.message;
      }
      if (body.errors && typeof body.errors === 'object') {
        const parts = [];
        for (const [field, val] of Object.entries(body.errors)) {
          if (Array.isArray(val)) {
            parts.push(`${field}: ${val.join(', ')}`);
          } else if (typeof val === 'object' && val !== null) {
            // e.g. { message: '...' } shapes
            const vmsg = val.message || JSON.stringify(val);
            parts.push(`${field}: ${vmsg}`);
          } else {
            parts.push(`${field}: ${val}`);
          }
        }
        if (parts.length) {
          return parts.join(' ');
        }
      }
    }
  }

  // Fall back to generic error fields
  return error.message || fallback;
}

export function UserProfile() {
  const { user, updateProfile, changePassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Primary user feedback strings
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Extra diagnostics for 422 and other API validation errors
  const [errorStatus, setErrorStatus] = useState(null); // e.g., 422
  const [errorDetails, setErrorDetails] = useState(null); // raw server body

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
      });
    }
  }, [user]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
    setErrorStatus(null);
    setErrorDetails(null);
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
    if (error) clearMessages();
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
    if (error) clearMessages();
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();

    try {
      await updateProfile(profileData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Profile update failed', err);
      const msg = extractApiErrorMessage(err, 'Failed to update profile');
      setError(msg);
      setErrorStatus(err?.status ?? null);
      setErrorDetails(err?.body ?? null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      setErrorStatus(null);
      setErrorDetails(null);
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError('New password must be at least 6 characters long');
      setErrorStatus(null);
      setErrorDetails(null);
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setSuccess('Password changed successfully!');
      setIsChangingPassword(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      console.error('Password change failed', err);
      const msg = extractApiErrorMessage(err, 'Failed to change password');
      setError(msg);
      setErrorStatus(err?.status ?? null);
      setErrorDetails(err?.body ?? null);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    clearMessages();
    // Reset to original user data
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
      });
    }
  };

  const cancelPasswordChange = () => {
    setIsChangingPassword(false);
    clearMessages();
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
  };

  const renderValidationList = () => {
    if (!errorDetails || typeof errorDetails !== 'object') return null;

    // Common Flask/Marshmallow/Pydantic shapes
    const errorsObj =
      (errorDetails.errors && typeof errorDetails.errors === 'object' && errorDetails.errors) ||
      (errorDetails.field_errors && typeof errorDetails.field_errors === 'object' && errorDetails.field_errors) ||
      null;

    if (!errorsObj) return null;

    const entries = Object.entries(errorsObj);
    if (!entries.length) return null;

    return (
      <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-red-700">
        {entries.map(([field, val]) => {
          const msg = Array.isArray(val) ? val.join(', ') : typeof val === 'object' ? JSON.stringify(val) : String(val);
          return (
            <li key={field}>
              <span className="font-medium">{field}:</span> {msg}
            </li>
          );
        })}
      </ul>
    );
  };

  const renderDebugDetails = () => {
    if (!error) return null;
    return (
      <div className="mt-2">
        {errorStatus ? (
          <p className="text-xs text-red-700">
            Status: <span className="font-mono">{errorStatus}</span>
          </p>
        ) : null}
        {errorStatus === 422 ? renderValidationList() : null}
        {/* Collapsible raw payload for deeper diagnosis */}
        {errorDetails ? (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-red-700 underline">Show server response</summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded bg-red-50 p-2 text-xs text-red-800 border border-red-200">
{JSON.stringify(errorDetails, null, 2)}
            </pre>
          </details>
        ) : null}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-gray-600">Please log in to view your profile.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Information
          </CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {(error || success) && (
            <div
              className={`mb-4 p-3 rounded-md ${
                error
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-green-50 border border-green-200'
              }`}
            >
              <p className={`text-sm ${error ? 'text-red-600' : 'text-green-600'}`}>
                {error || success}
              </p>
              {error ? renderDebugDetails() : null}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={profileData.first_name}
                    onChange={handleProfileChange}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={profileData.last_name}
                    onChange={handleProfileChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={profileData.username}
                  onChange={handleProfileChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <p className="text-gray-900">{user.first_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <p className="text-gray-900">{user.last_name || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <p className="text-gray-900">{user.username}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{user.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <p className="text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Change Password</CardTitle>
          {!isChangingPassword && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChangingPassword(true)}
            >
              Change Password
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isChangingPassword ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <Input
                  id="current_password"
                  name="current_password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <Input
                  id="new_password"
                  name="new_password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  disabled={isLoading}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelPasswordChange}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-gray-600">
              Click "Change Password" to update your password.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```
