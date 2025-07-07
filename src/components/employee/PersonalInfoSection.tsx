
import React from 'react'
import { EmployeeFormData } from './EmployeeFormTypes'

interface PersonalInfoSectionProps {
  formData: EmployeeFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  validationErrors: Record<string, string>
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({ formData, onChange, validationErrors }) => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="font-semibold text-blue-900 mb-4">Personal Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
          <input
            type="text"
            name="firstName"
            required
            value={formData.firstName}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.firstName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.firstName && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.firstName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
          <input
            type="text"
            name="lastName"
            required
            value={formData.lastName}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.lastName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.lastName && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.lastName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.email && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
          <select
            name="gender"
            required
            value={formData.gender}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.gender ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {validationErrors.gender && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.gender}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name *</label>
          <input
            type="text"
            name="fathersName"
            required
            value={formData.fathersName}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.fathersName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.fathersName && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.fathersName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
          <input
            type="number"
            name="age"
            required
            min="18"
            max="100"
            value={formData.age}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.age ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.age && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.age}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number *</label>
          <input
            type="text"
            name="aadhar"
            required
            value={formData.aadhar}
            onChange={onChange}
            placeholder="1234 5678 9012"
            maxLength={12}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.aadhar ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.aadhar && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.aadhar}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default PersonalInfoSection
