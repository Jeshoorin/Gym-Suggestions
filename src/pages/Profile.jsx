import React, { useState, useEffect } from 'react';
import '../styles/PageStyles.css';
import { useAuth } from '../AuthContext';

const Profile = () => {
  const { user, profile, setProfile } = useAuth();
  const [isOverlayOpen, setOverlayOpen] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch profile data from the backend when the component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/get-profile/${encodeURIComponent(user.email)}`);
        const data = await res.json();
    
        if (res.ok) {
          // Ensure dietary_restrictions is an array
          setProfile(data);
          setEditedProfile({
            ...data,
            dietary_restrictions: data.dietary_restrictions || [], // Ensure it's an array
          });
        } else {
          console.error("Error fetching profile:", data.error);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    

    if (user && user.email) {
      fetchProfile();
    }
  }, [user, setProfile]);

  const handleEditClick = () => {
    setOverlayOpen(true);  // Open the overlay for editing
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name === 'dietary_restrictions') {
      // If the checkbox is checked, add the value to the list; if unchecked, remove it
      setEditedProfile((prevState) => {
        const updatedDietaryRestrictions = checked
          ? [...(prevState.dietary_restrictions || []), value]  // Add the value
          : prevState.dietary_restrictions?.filter(item => item !== value);  // Remove the value if unchecked
  
        return {
          ...prevState,
          [name]: updatedDietaryRestrictions
        };
      });
    } else {
      setEditedProfile((prevState) => ({
        ...prevState,
        [name]: value
      }));
    }
  };
  
  
  const handleSave = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/save-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProfile),
      });

      const data = await res.json();

      if (res.ok) {
        setProfile(editedProfile);  // Update the profile in context
        localStorage.setItem('profile', JSON.stringify(editedProfile));  // Persist to localStorage
        setOverlayOpen(false);  // Close overlay
      } else {
        console.error("Error saving profile:", data.error);
      }
    } catch (err) {
      console.error("Error saving profile:", err);
    }
  };

  const handleCancel = () => {
    setOverlayOpen(false);  // Close overlay without saving
  };

  const dietaryOptions = [
    'Gluten-free',
    'Vegetarian',
    'Vegan',
    'Paleo',
    'Dairy-free'
  ];

  return (
    <div className="page-container">
      <div className="page-card">
        <h1>Your Profile</h1>
        {loading ? (
          <p>Loading profile...</p>
        ) : profile ? (
          <>
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>Age:</strong> {profile.age}</p>
            <p><strong>Height:</strong> {profile.height_cm} cm</p>
            <p><strong>Weight:</strong> {profile.weight_kg} kg</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Fitness Level:</strong> {profile.fitness_level}</p>
            <p><strong>Gender:</strong> {profile.gender}</p>
            <button onClick={handleEditClick}>Edit Profile</button>
          </>
        ) : (
          <p>No profile found.</p>
        )}
      </div>

      {/* Edit Profile Overlay */}
      {isOverlayOpen && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>Edit Profile</h2>
            <form>
              <label>
                Name:
                <input
                  type="text"
                  name="name"
                  value={editedProfile.name || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Age:
                <input
                  type="number"
                  name="age"
                  value={editedProfile.age || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Height (cm):
                <input
                  type="number"
                  name="height_cm"
                  value={editedProfile.height_cm || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Weight (kg):
                <input
                  type="number"
                  name="weight_kg"
                  value={editedProfile.weight_kg || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  name="email"
                  value={editedProfile.email || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Fitness Level:
                <input
                  type="text"
                  name="fitness_level"
                  value={editedProfile.fitness_level || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Gender:
                <input
                  type="text"
                  name="gender"
                  value={editedProfile.gender || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Bicep (cm):
                <input
                  type="number"
                  name="bicep_cm"
                  value={editedProfile.bicep_cm || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Chest (cm):
                <input
                  type="number"
                  name="chest_cm"
                  value={editedProfile.chest_cm || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Shoulder (cm):
                <input
                  type="number"
                  name="shoulder_cm"
                  value={editedProfile.shoulder_cm || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Lat (cm):
                <input
                  type="number"
                  name="lat_cm"
                  value={editedProfile.lat_cm || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Waist (cm):
                <input
                  type="number"
                  name="waist_cm"
                  value={editedProfile.waist_cm || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Abs (cm):
                <input
                  type="number"
                  name="abs_cm"
                  value={editedProfile.abs_cm || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Thigh (cm):
                <input
                  type="number"
                  name="thigh_cm"
                  value={editedProfile.thigh_cm || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Calf (cm):
                <input
                  type="number"
                  name="calf_cm"
                  value={editedProfile.calf_cm || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Blood Sugar (mg/dL):
                <input
                  type="number"
                  name="blood_sugar_mg_dl"
                  value={editedProfile.blood_sugar_mg_dl || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
                Medical History:
                <input
                  type="text"
                  name="medical_history"
                  value={editedProfile.medical_history || ''}
                  onChange={handleInputChange}
                />
              </label>
              <label>
  Dietary Restrictions:
  <div className="multi-select-checkboxes">
    <label>
      <input
        type="checkbox"
        name="dietary_restrictions"
        value="gluten-free"
        checked={editedProfile.dietary_restrictions?.includes('gluten-free')}
        onChange={handleInputChange}
      />
      Gluten-Free
    </label>
    <label>
      <input
        type="checkbox"
        name="dietary_restrictions"
        value="vegetarian"
        checked={editedProfile.dietary_restrictions?.includes('vegetarian')}
        onChange={handleInputChange}
      />
      Vegetarian
    </label>
    <label>
      <input
        type="checkbox"
        name="dietary_restrictions"
        value="vegan"
        checked={editedProfile.dietary_restrictions?.includes('vegan')}
        onChange={handleInputChange}
      />
      Vegan
    </label>
    <label>
      <input
        type="checkbox"
        name="dietary_restrictions"
        value="paleo"
        checked={editedProfile.dietary_restrictions?.includes('paleo')}
        onChange={handleInputChange}
      />
      Paleo
    </label>
    <label>
      <input
        type="checkbox"
        name="dietary_restrictions"
        value="dairy-free"
        checked={editedProfile.dietary_restrictions?.includes('dairy-free')}
        onChange={handleInputChange}
      />
      Dairy-Free
    </label>
    <label>
      <input
        type="checkbox"
        name="dietary_restrictions"
        value="kosher"
        checked={editedProfile.dietary_restrictions?.includes('kosher')}
        onChange={handleInputChange}
      />
      Kosher
    </label>
  </div>
</label>
            </form>
            <div className="overlay-actions">
              <button onClick={handleSave}>Save</button>
              <button onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
