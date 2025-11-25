# File Stream Upload

> - Upload files using multipart/form-data format
- Supports both underscore and camelCase parameter naming
- Suitable for uploading local files directly
- Files will expire after 72 hours
- Current user quota is limited. Uploads will fail when quota is exhausted. Please save locally if persistent storage is needed

**Note:**
The file upload API base URL is`https://files-api.evolink.ai`

## OpenAPI

````yaml en/api-manual/file-series/upload-stream.json post /api/v1/files/upload/stream
paths:
  path: /api/v1/files/upload/stream
  method: post
  servers:
    - url: https://files-api.evolink.ai
      description: File Service Environment
  request:
    security:
      - title: bearerAuth
        parameters:
          query: {}
          header:
            Authorization:
              type: http
              scheme: bearer
              description: >-
                ##All APIs require Bearer Token authentication##


                **Get API Key:**


                Visit [API Key Management
                Page](https://evolink.ai/dashboard/keys) to obtain your API Key


                **Add to request header:**

                ```

                Authorization: Bearer YOUR_API_KEY

                ```
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      multipart/form-data:
        schemaArray:
          - type: object
            properties:
              file:
                allOf:
                  - type: string
                    format: binary
                    description: >-
                      File binary data


                      **Note:**

                      - Upload via form-data format

                      - System will automatically identify file type

                      - Maximum `1` image per request

                      - Currently supports uploading files in: `image/jpeg`,
                      `image/png`, `image/gif`, `image/webp` formats only
              upload_path:
                allOf:
                  - type: string
                    description: >-
                      Custom upload path


                      **Note:**

                      - Supports underscore naming: `upload_path`

                      - Supports camelCase naming: `uploadPath`

                      - If not specified, system will automatically categorize
                      based on file type
                    example: photos
              file_name:
                allOf:
                  - type: string
                    description: >-
                      Custom file name


                      **Note:**

                      - Supports underscore naming: `file_name`

                      - Supports camelCase naming: `fileName`

                      - If not specified, system will automatically generate a
                      unique file name
                    example: photo.png
            required: true
            refIdentifier: '#/components/schemas/StreamUploadRequest'
            requiredProperties:
              - file
        examples:
          stream_upload:
            summary: File Stream Upload
            value:
              file: '@/path/to/file.png'
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              success:
                allOf:
                  - type: boolean
                    description: Whether the request was successful
                    example: true
              code:
                allOf:
                  - type: integer
                    description: Response status code
                    example: 200
              msg:
                allOf:
                  - type: string
                    description: Response message
                    example: File uploaded successfully
              data:
                allOf:
                  - $ref: '#/components/schemas/FileData'
            refIdentifier: '#/components/schemas/FileUploadResponse'
        examples:
          example:
            value:
              success: true
              code: 200
              msg: File uploaded successfully
              data:
                file_id: file_abc123
                file_name: photo.png
                original_name: photo.png
                file_size: 2048
                mime_type: image/png
                upload_path: photos
                file_url: https://files.evolink.ai/photos/photo.png
                download_url: https://files.evolink.ai/api/v1/files/download/file_abc123
                upload_time: '2025-10-09T00:00:00+08:00'
                expires_at: '2025-10-12T00:00:00+08:00'
        description: File uploaded successfully
  deprecated: false
  type: path
components:
  schemas:
    FileData:
      type: object
      properties:
        file_id:
          type: string
          description: Unique file identifier
          example: file_abc123
        file_name:
          type: string
          description: Stored file name
          example: photo.png
        original_name:
          type: string
          description: Original file name
          example: photo.png
        file_size:
          type: integer
          description: File size (bytes)
          example: 2048
        mime_type:
          type: string
          description: File MIME type
          example: image/png
        upload_path:
          type: string
          description: File storage path
          example: photos
        file_url:
          type: string
          format: uri
          description: File access URL
          example: https://files.evolink.ai/photos/photo.png
        download_url:
          type: string
          format: uri
          description: File download URL
          example: https://files.evolink.ai/api/v1/files/download/file_abc123
        upload_time:
          type: string
          format: date-time
          description: Upload time (ISO 8601 format)
          example: '2025-10-09T00:00:00+08:00'
        expires_at:
          type: string
          format: date-time
          description: File expiration time (ISO 8601 format)
          example: '2025-10-12T00:00:00+08:00'

````