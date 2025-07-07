
import React from 'react'
import { EmployeeFormData } from './EmployeeFormTypes'

interface AddressSectionProps {
  formData: EmployeeFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  validationErrors: Record<string, string>
}

const AddressSection: React.FC<AddressSectionProps> = ({ formData, onChange, validationErrors }) => {
  return (
    <div className="bg-purple-50 p-4 rounded-lg">
      <h3 className="font-semibold text-purple-900 mb-4">Address Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
          <input
            type="text"
            name="addressLine1"
            required
            value={formData.addressLine1}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              validationErrors.addressLine1 ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.addressLine1 && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.addressLine1}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 *</label>
          <input
            type="text"
            name="addressLine2"
            required
            value={formData.addressLine2}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              validationErrors.addressLine2 ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.addressLine2 && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.addressLine2}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <input
            type="text"
            name="city"
            required
            value={formData.city}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              validationErrors.city ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.city && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.city}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
          <input
            type="text"
            name="state"
            required
            value={formData.state}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              validationErrors.state ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.state && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.state}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
          <input
            type="text"
            name="pincode"
            required
            value={formData.pincode}
            onChange={onChange}
            className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              validationErrors.pincode ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.pincode && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.pincode}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddressSection
