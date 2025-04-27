const getProfileTemplate = (user) => `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Profile</title>
            <style>
                body {
                    font-family: 'Inter', sans-serif;
                    margin: 0;
                    padding: 0;
                    border-radius: 8px;
                    background: linear-gradient(180deg, #FCFAF4 0%, #F8F4E1 100%);
                }
                
                .content {
                    max-width: 800px;
                    margin: 20px auto;
                    border-radius: 8px;
                    background: linear-gradient(180deg, #FCFAF4 0%, #F8F4E1 100%);
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    text-align: center;
                }
                
                
                .avatar {
                    width: 150px; 
                    height: 150px;
                    border-radius: 50%;
                    border: 3px solid #5A360F;
                }
            
                .divider {
                    width: 100%;
                    height: 1px;
                    background-color: #0000001a;
                    margin: 10px 0;
                }
                
            
                .section {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 20px;
                
                }
                
                .section img {
                    width: 20px;
                    height: 20px;
                }
                
                .section-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: #222;
                }
                
            
                .info-grid {
                    border-radius: 8px;
                    border: 1px solid rgba(90, 54, 15, 0.10);
                    box-shadow: 2px 0px 6px 0px rgba(0, 0, 0, 0.10);
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 2fr));
                    gap: 10px;
                    padding: 15px;
                    text-align: left;
                }
                .contact-grid {
                    border-radius: 8px;
                    border: 1px solid rgba(90, 54, 15, 0.10);
                    box-shadow: 2px 0px 6px 0px rgba(0, 0, 0, 0.10);
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 2fr));
                    gap: 10px;
                    padding: 15px;
                    text-align: left;
                }
                .health-grid {
                    border-radius: 8px;
                    border: 1px solid rgba(90, 54, 15, 0.10);
                    box-shadow: 2px 0px 6px 0px rgba(0, 0, 0, 0.10);
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
                    gap: 10px;
                    padding: 15px;
                    text-align: left;
                }
            
                .info-item {
                    background: transparent;
                    padding: 10px;
                    border-radius: 5px;
                }
                
            
                .info-label {
                    font-size: 14px;
                    color: rgba(90, 54, 15, 0.60);
                    font-weight: 500;
                    margin-bottom: 5px;
                }
                
                .info-value {
                    font-size: 14px;
                    color: #5A360F;
                    font-weight: 600;
                    margin-left: 2px;
                }
                
            
                @media (max-width: 768px) {
                    .content {
                        width: 90%;
                        padding: 15px;
                    }
                
                    .avatar {
                        width: 120px;
                        height: 120px;
                    }
                
                    .info-grid, .contact-grid, .health-grid {
                        grid-template-columns: 1fr;
                    }
                
                    .divider {
                        margin: 15px 0;
                    }
                
                
                
                    .section-title {
                        font-size: 16px;
                    }
                }
                
                @media (max-width: 480px) {
                    .content {
                        width: 95%;
                        padding: 10px;
                    }
                
                    .avatar {
                        width: 100px;
                        height: 100px;
                    }
                
                    .info-label, .info-value {
                        font-size: 13px;
                    }
                
                    .divider {
                        margin: 10px 0;
                    }
                }
                
            </style>
        </head>
        <body>

            <div class="content">
                <img src="${user.photo}" alt="Profile Picture" class="avatar">
                <p class="name">${user.name}</p>

            

            

                <!-- Basic Information Section -->
                <div class="section">
                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                        <path d="M18 9.5C18 4.80545 14.1946 1 9.5 1C4.80545 1 1 4.80545 1 9.5C1 14.1946 4.80545 18 9.5 18C14.1946 18 18 14.1946 18 9.5Z" 
                            stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M9.85 13.65V9.4C9.85 8.99965 9.85 8.79905 9.7259 8.6741C9.60095 8.55 9.4012 8.55 9 8.55M9.6375 6H9.64515" 
                            stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    
                    <p class="section-title">Basic Information</p>
                </div>

                <div class="info-grid">
                    <div class="info-item">
                        <p class="info-label">• Full name</p>
                        <p class="info-value">${user.name}</p>
                    </div>
                    <div class="info-item">
                        <p class="info-label">• Nationality</p>
                        <p class="info-value">${user.nationality}</p>
                    </div>
                    <div class="info-item">
                        <p class="info-label">• State</p>
                        <p class="info-value">${user.state}</p>
                    </div>
                
            
                    <div class="info-item">
                        <p class="info-label">• Passport number</p>
                        <p class="info-value">${user.passPortNumber}</p>
                    </div>
                    <div class="info-item">
                        <p class="info-label">• Date of birth</p>
                        <p class="info-value">${user.birthDate}</p>
                    </div>
                    <div class="info-item">
                        <p class="info-label">• Marital Status</p>
                        <p class="info-value">${user.maritalStatus}</p>
                    </div>
                </div>

            

                <!-- Contact Information Section -->
                <div class="section">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="19" viewBox="0 0 18 19" fill="none">
                        <path d="M2.2627 7.80583C2.2627 4.61151 2.2627 3.01393 3.24966 2.02201C4.23663 1.03008 5.82402 1.02924 8.99966 1.02924H10.2628C13.4385 1.02924 15.0267 1.02924 16.0128 2.02201C16.999 3.01478 16.9998 4.61151 16.9998 7.80583V11.1941C16.9998 14.3884 16.9998 15.986 16.0128 16.9779C15.0259 17.9699 13.4385 17.9707 10.2628 17.9707H8.99966C5.82402 17.9707 4.23578 17.9707 3.24966 16.9779C2.26354 15.9852 2.2627 14.3884 2.2627 11.1941V7.80583Z" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M7.14748 9.47784C6.78789 8.84762 6.61442 8.33344 6.50999 7.81165C6.35504 7.04081 6.70958 6.28691 7.29569 5.80577C7.54412 5.60248 7.82791 5.67194 7.97444 5.93707L8.3054 6.53426C8.5673 7.00692 8.69867 7.24411 8.67256 7.49484C8.6473 7.74557 8.47045 7.94972 8.11676 8.35886L7.14748 9.47784ZM7.14748 9.47784C7.90548 10.7843 8.98635 11.8716 10.2852 12.634M10.2852 12.634C10.9118 12.9957 11.4229 13.1702 11.9417 13.2753C12.708 13.4311 13.4575 13.0745 13.9358 12.485C14.1379 12.2351 14.0689 11.9496 13.8053 11.8022L13.2124 11.4693C12.7408 11.2059 12.5059 11.0737 12.2566 11.1C12.0074 11.1254 11.8044 11.3033 11.3977 11.6591L10.2852 12.634ZM3.1053 4.41742H1M3.1053 9.49986H1M3.1053 14.5823H1" stroke="#222222" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p class="section-title">Contact Information</p>
                </div>

                <div class="contact-grid">
                    <div class="info-item">
                        <p class="info-label">• Number of the tourism company</p>
                        <p class="info-value">${user.companyNumber}</p>
                    </div>
                    <div class="info-item">
                        <p class="info-label">• Name of the tourism company</p>
                        <p class="info-value">${user.companyName}</p>
                    </div>
                
                    <div class="info-item">
                        <p class="info-label">• Relative's Phone Number</p>
                        <p class="info-value">${user.relativePhone}</p>
                    </div>
                    <div class="info-item">
                        <p class="info-label">• Relationship</p>
                        <p class="info-value">${user.relationship}</p>
                    </div>
                </div>

            

                <!-- Health Information Section -->
                <div class="section">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="19" viewBox="0 0 15 19" fill="none">
                        <path d="M5.0625 8.70028H9.9375M7.5 11.1003V6.30027M1 8.90188C1 15.0515 6.62088 17.2115 7.40819 17.4843C7.4694 17.5056 7.5306 17.5056 7.59181 17.4843C8.38075 17.2203 14 15.1147 14 8.90268V3.34346C14.0002 3.27197 13.976 3.20247 13.9314 3.14607C13.8868 3.08967 13.8243 3.0496 13.7538 3.03226L7.57881 1.50986C7.52707 1.49712 7.47293 1.49712 7.42119 1.50986L1.24619 3.03226C1.17574 3.0496 1.11322 3.08967 1.0686 3.14607C1.02398 3.20247 0.99983 3.27197 1 3.34346V8.90188Z" stroke="#222222" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p class="section-title">Health Information</p>
                </div>

                <div class="health-grid">
                    <div class="info-item">
                        <p class="info-label">• Chronic diseases</p>
                        <p class="info-value">${user.myDiseases}</p>
                    </div>
                
                    <div class="info-item">
                        <p class="info-label">• Chronic medications</p>
                        <p class="info-value">${user.medicinesName}</p>
                    </div>
                </div>

            
            </div>

        </body>
        </html>`;