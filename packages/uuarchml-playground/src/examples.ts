export class ExampleLoader {
  async load(filename: string): Promise<string> {
    const response = await fetch(`/examples/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load example: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }
}
